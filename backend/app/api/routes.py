from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime
from collections import Counter
import asyncio
import json

from app.models import Alert, AlertStatus, TimelineEvent
from app.services.storage import storage
from app.services.mock_data import generate_seed_alerts, make_alert, make_timeline_events
from app.services.log_data import generate_seed_logs, make_log, SOURCE_TYPES, EVENT_TYPES, SEVERITY_LEVELS

router = APIRouter()


def _build_stats(alerts: list) -> dict:
    if not alerts:
        return {
            "total_alerts": 0, "open_alerts": 0, "critical_alerts": 0,
            "high_alerts": 0, "medium_alerts": 0, "low_alerts": 0,
            "resolved_today": 0, "avg_risk_score": 0,
            "top_alert_types": [], "alerts_by_hour": [],
        }
    type_counter = Counter(a.get("alert_type") for a in alerts)
    top_types = [{"type": t, "count": c} for t, c in type_counter.most_common(6)]
    hour_counter: Counter = Counter()
    for a in alerts:
        ts = a.get("timestamp", "")
        if ts:
            try:
                h = datetime.fromisoformat(ts.replace("Z", "")).hour
                hour_counter[h] += 1
            except Exception:
                pass
    alerts_by_hour = [{"hour": f"{h:02d}:00", "count": hour_counter.get(h, 0)} for h in range(24)]
    risk_scores = [a.get("risk_score", 0) for a in alerts]
    return {
        "total_alerts": len(alerts),
        "open_alerts": sum(1 for a in alerts if a.get("status") == "open"),
        "critical_alerts": sum(1 for a in alerts if a.get("severity") == "critical"),
        "high_alerts": sum(1 for a in alerts if a.get("severity") == "high"),
        "medium_alerts": sum(1 for a in alerts if a.get("severity") == "medium"),
        "low_alerts": sum(1 for a in alerts if a.get("severity") == "low"),
        "resolved_today": sum(1 for a in alerts if a.get("status") == "resolved"),
        "avg_risk_score": round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 0,
        "top_alert_types": top_types,
        "alerts_by_hour": alerts_by_hour,
    }


# ── Health ──────────────────────────────────────────────────────────────────
@router.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": {"redis": storage.ping()},
    }


# ── Seed / Mock ──────────────────────────────────────────────────────────────
@router.post("/seed")
def seed_data():
    storage.flush_all()
    alerts = generate_seed_alerts(40)
    for alert in alerts:
        storage.store_alert(alert.id, alert.model_dump())
        for ev in make_timeline_events(alert):
            storage.store_timeline_event(ev.model_dump())
    return {"seeded": len(alerts)}


@router.post("/alerts/mock")
def create_mock_alert():
    alert = make_alert()
    storage.store_alert(alert.id, alert.model_dump())
    for ev in make_timeline_events(alert):
        storage.store_timeline_event(ev.model_dump())
    return alert


# ── Alerts ───────────────────────────────────────────────────────────────────
@router.get("/alerts")
def list_alerts(
    limit: int = Query(100, le=500),
    status: Optional[str] = None,
    severity: Optional[str] = None,
):
    alerts = storage.get_all_alerts(limit=limit, status=status)
    if severity:
        alerts = [a for a in alerts if a.get("severity") == severity]
    return alerts


@router.get("/alerts/{alert_id}")
def get_alert(alert_id: str):
    alert = storage.get_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/alerts/{alert_id}/status")
def update_status(alert_id: str, body: dict):
    status = body.get("status")
    if status not in [s.value for s in AlertStatus]:
        raise HTTPException(status_code=400, detail="Invalid status")
    alert = storage.update_alert(alert_id, {"status": status})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


# ── Stats ─────────────────────────────────────────────────────────────────────
@router.get("/stats")
def get_stats():
    return _build_stats(storage.get_all_alerts(limit=500))


# ── Dashboard SSE stream ───────────────────────────────────────────────────────
@router.get("/stream/dashboard")
async def stream_dashboard(request: Request):
    async def generate():
        while True:
            if await request.is_disconnected():
                break
            alerts_all = storage.get_all_alerts(limit=500)
            alerts_feed = storage.get_all_alerts(limit=30)
            payload = json.dumps({"stats": _build_stats(alerts_all), "alerts": alerts_feed})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(3)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


# ── Timeline ──────────────────────────────────────────────────────────────────
@router.get("/timeline")
def get_timeline(alert_id: Optional[str] = None, limit: int = 200):
    return storage.get_timeline(alert_id=alert_id, limit=limit)


# ── Logs ──────────────────────────────────────────────────────────────────────
@router.get("/logs")
def search_logs(
    q: Optional[str] = Query(None, description="Full-text search across message, IP, host, user"),
    source_type: Optional[str] = Query(None),
    data_stream: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    host: Optional[str] = Query(None),
    source_ip: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
):
    return storage.search_logs(
        q=q, source_type=source_type, data_stream=data_stream,
        event_type=event_type, severity=severity, host=host,
        source_ip=source_ip, limit=limit, offset=offset,
    )


@router.get("/logs/stats")
def logs_stats(
    q: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    data_stream: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    host: Optional[str] = Query(None),
    source_ip: Optional[str] = Query(None),
):
    result = storage.search_logs(
        q=q, source_type=source_type, data_stream=data_stream,
        event_type=event_type, severity=severity, host=host,
        source_ip=source_ip, limit=5000, offset=0,
    )
    logs = result["logs"]

    from collections import Counter
    by_sev = Counter(l.get("severity", "UNKNOWN") for l in logs)
    by_stream = Counter(l.get("data_stream", "") for l in logs)
    by_event = Counter(l.get("event_type", "") for l in logs)

    hour_counter: Counter = Counter()
    for l in logs:
        ts = l.get("timestamp", "")
        if ts:
            try:
                h = datetime.fromisoformat(ts.replace("Z", "")).hour
                hour_counter[h] += 1
            except Exception:
                pass

    return {
        "total": result["total"],
        "by_severity": [{"severity": k, "count": v} for k, v in by_sev.most_common()],
        "by_stream": [{"stream": k, "count": v} for k, v in by_stream.most_common(10)],
        "by_hour": [{"hour": f"{h:02d}:00", "count": hour_counter.get(h, 0)} for h in range(24)],
        "by_event_type": [{"type": k, "count": v} for k, v in by_event.most_common(8)],
    }


@router.get("/logs/meta")
def logs_meta():
    """Returns filter options for the log search UI."""
    from app.services.log_data import DATA_STREAMS
    all_event_types = sorted({et for evts in EVENT_TYPES.values() for et in evts})
    return {
        "source_types": sorted(SOURCE_TYPES),
        "event_types": all_event_types,
        "severities": SEVERITY_LEVELS,
        "data_streams": sorted(DATA_STREAMS.values()),
    }


@router.post("/logs/ingest")
def ingest_log(body: dict):
    log = make_log()
    log.update({k: v for k, v in body.items() if k in log})
    storage.store_log(log)
    return log
