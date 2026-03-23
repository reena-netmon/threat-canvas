from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


class AlertStatus(str, Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MitreTag(BaseModel):
    tactic: str
    technique: str
    technique_id: str


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    alert_type: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    risk_score: int = Field(ge=0, le=100)
    severity: Severity
    status: AlertStatus = AlertStatus.OPEN
    user: Optional[str] = None
    host: Optional[str] = None
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    description: str = ""
    mitre: Optional[List[MitreTag]] = None
    tags: Optional[List[str]] = None
    raw_event: Optional[Dict[str, Any]] = None


class TimelineEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_id: str
    timestamp: str
    event_type: str
    actor: Optional[str] = None
    target: Optional[str] = None
    action: str
    result: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    mitre: Optional[MitreTag] = None


class StatsResponse(BaseModel):
    total_alerts: int
    open_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    resolved_today: int
    avg_risk_score: float
    top_alert_types: List[Dict[str, Any]]
    alerts_by_hour: List[Dict[str, Any]]
