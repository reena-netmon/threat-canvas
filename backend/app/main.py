from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.auth import router as auth_router

app = FastAPI(title="ThreatCanvas SOC API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api")


@app.on_event("startup")
async def startup():
    from app.services.storage import storage
    from app.services.mock_data import generate_seed_alerts, make_timeline_events
    from app.services.log_data import generate_seed_logs
    alerts = storage.get_all_alerts(limit=1)
    if not alerts:
        seed_alerts = generate_seed_alerts(40)
        for alert in seed_alerts:
            storage.store_alert(alert.id, alert.model_dump())
            for ev in make_timeline_events(alert):
                storage.store_timeline_event(ev.model_dump())
        print(f"[startup] Seeded {len(seed_alerts)} alerts")
        seed_logs = generate_seed_logs(500)
        storage.store_logs_bulk(seed_logs)
        print(f"[startup] Seeded {len(seed_logs)} logs")
