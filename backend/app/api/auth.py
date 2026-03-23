from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

USERS = [
    {
        "id": "u1",
        "email": "reena.patil@bloo.io",
        "password": "Bloo@2025",
        "name": "Reena Patil",
        "role": "SOC Manager",
        "avatar": "RP",
        "tier": "admin",
        "team": "Security Operations",
    },
    {
        "id": "u2",
        "email": "alice.chen@bloo.io",
        "password": "Bloo@2025",
        "name": "Alice Chen",
        "role": "Tier-1 Analyst",
        "avatar": "AC",
        "tier": "tier1",
        "team": "Alert Triage",
    },
    {
        "id": "u3",
        "email": "bob.martinez@bloo.io",
        "password": "Bloo@2025",
        "name": "Bob Martinez",
        "role": "Tier-2 Analyst",
        "avatar": "BM",
        "tier": "tier2",
        "team": "Incident Response",
    },
    {
        "id": "u4",
        "email": "carol.singh@bloo.io",
        "password": "Bloo@2025",
        "name": "Carol Singh",
        "role": "Threat Hunter",
        "avatar": "CS",
        "tier": "hunter",
        "team": "Proactive Defense",
    },
    {
        "id": "u5",
        "email": "dave.kim@bloo.io",
        "password": "Bloo@2025",
        "name": "Dave Kim",
        "role": "Forensic Analyst",
        "avatar": "DK",
        "tier": "forensic",
        "team": "Digital Forensics",
    },
]

_by_email = {u["email"]: u for u in USERS}


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def login(body: LoginRequest):
    user = _by_email.get(body.email.lower().strip())
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {k: v for k, v in user.items() if k != "password"}


@router.get("/auth/users")
def list_users():
    """Dev helper — lists all users (no passwords)."""
    return [{k: v for k, v in u.items() if k != "password"} for u in USERS]
