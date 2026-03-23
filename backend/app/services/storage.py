"""
In-memory storage service (Redis-compatible interface, no external deps).
"""
from typing import Optional, List, Dict, Any


class StorageService:
    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._alerts_index: List[str] = []
        self._timeline_index: List[str] = []
        self._logs: List[Dict[str, Any]] = []  # stored in-order, newest first

    def ping(self) -> bool:
        return True

    # ── generic ──────────────────────────────────────────────────────────────
    def store(self, key: str, data: Dict[str, Any]) -> None:
        self._data[key] = data

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        return self._data.get(key)

    def delete(self, key: str) -> None:
        self._data.pop(key, None)

    # ── alerts ────────────────────────────────────────────────────────────────
    def store_alert(self, alert_id: str, data: Dict[str, Any]) -> None:
        self._data[f"alert:{alert_id}"] = data
        if alert_id not in self._alerts_index:
            self._alerts_index.append(alert_id)

    def get_alert(self, alert_id: str) -> Optional[Dict[str, Any]]:
        return self._data.get(f"alert:{alert_id}")

    def get_all_alerts(self, limit: int = 100, status: Optional[str] = None) -> List[Dict[str, Any]]:
        alerts = []
        for aid in self._alerts_index:
            a = self._data.get(f"alert:{aid}")
            if a:
                if status and a.get("status") != status:
                    continue
                alerts.append(a)
        alerts.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return alerts[:limit]

    def update_alert(self, alert_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        alert = self.get_alert(alert_id)
        if not alert:
            return None
        alert.update(updates)
        self.store_alert(alert_id, alert)
        return alert

    # ── timeline ──────────────────────────────────────────────────────────────
    def store_timeline_event(self, event: Dict[str, Any]) -> None:
        eid = event["id"]
        self._data[f"timeline:{eid}"] = event
        if eid not in self._timeline_index:
            self._timeline_index.append(eid)

    def get_timeline(self, alert_id: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
        events = []
        for eid in self._timeline_index:
            e = self._data.get(f"timeline:{eid}")
            if e:
                if alert_id and e.get("alert_id") != alert_id:
                    continue
                events.append(e)
        events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return events[:limit]

    # ── logs ─────────────────────────────────────────────────────────────────
    def store_log(self, log: Dict[str, Any]) -> None:
        self._logs.insert(0, log)

    def store_logs_bulk(self, logs: List[Dict[str, Any]]) -> None:
        self._logs = logs + self._logs

    def search_logs(
        self,
        q: Optional[str] = None,
        source_type: Optional[str] = None,
        data_stream: Optional[str] = None,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        host: Optional[str] = None,
        source_ip: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Dict[str, Any]:
        results = self._logs
        if q:
            ql = q.lower()
            results = [
                l for l in results
                if ql in l.get("message", "").lower()
                or ql in l.get("source_ip", "").lower()
                or ql in l.get("host", "").lower()
                or ql in (l.get("user") or "").lower()
                or ql in l.get("event_type", "").lower()
                or ql in l.get("source_type", "").lower()
            ]
        if source_type:
            results = [l for l in results if l.get("source_type") == source_type]
        if data_stream:
            results = [l for l in results if l.get("data_stream") == data_stream]
        if event_type:
            results = [l for l in results if l.get("event_type") == event_type]
        if severity:
            results = [l for l in results if l.get("severity") == severity]
        if host:
            results = [l for l in results if l.get("host") == host]
        if source_ip:
            results = [l for l in results if l.get("source_ip") == source_ip]
        total = len(results)
        return {"total": total, "logs": results[offset: offset + limit]}

    def flush_all(self) -> None:
        self._data.clear()
        self._alerts_index.clear()
        self._timeline_index.clear()
        self._logs.clear()


storage = StorageService()
