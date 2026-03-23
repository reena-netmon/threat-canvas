import random
import uuid
from datetime import datetime, timedelta
from app.models import Alert, AlertStatus, Severity, MitreTag, TimelineEvent

ALERT_TEMPLATES = [
    {
        "title": "Brute Force Login Detected",
        "alert_type": "brute_force",
        "severity": Severity.HIGH,
        "risk_score_range": (70, 90),
        "description": "Multiple failed authentication attempts from a single source IP within a short time window.",
        "mitre": [MitreTag(tactic="Credential Access", technique="Brute Force", technique_id="T1110")],
        "tags": ["authentication", "brute-force", "credential"],
    },
    {
        "title": "Lateral Movement — Pass-the-Hash",
        "alert_type": "lateral_movement",
        "severity": Severity.CRITICAL,
        "risk_score_range": (85, 100),
        "description": "Credential hash reuse detected across multiple internal hosts, indicating lateral movement.",
        "mitre": [MitreTag(tactic="Lateral Movement", technique="Pass the Hash", technique_id="T1550.002")],
        "tags": ["lateral-movement", "credential", "pth"],
    },
    {
        "title": "Data Exfiltration via DNS Tunneling",
        "alert_type": "data_exfiltration",
        "severity": Severity.CRITICAL,
        "risk_score_range": (88, 100),
        "description": "Unusually high volume of DNS queries with large payloads detected, consistent with DNS tunneling.",
        "mitre": [MitreTag(tactic="Exfiltration", technique="Exfiltration Over Alternative Protocol", technique_id="T1048")],
        "tags": ["exfiltration", "dns", "tunneling"],
    },
    {
        "title": "Malware Execution — Cobalt Strike Beacon",
        "alert_type": "malware",
        "severity": Severity.CRITICAL,
        "risk_score_range": (90, 100),
        "description": "C2 beacon pattern matching Cobalt Strike framework detected on endpoint.",
        "mitre": [MitreTag(tactic="Command and Control", technique="Application Layer Protocol", technique_id="T1071")],
        "tags": ["malware", "c2", "cobalt-strike"],
    },
    {
        "title": "Privilege Escalation — Sudo Abuse",
        "alert_type": "privilege_escalation",
        "severity": Severity.HIGH,
        "risk_score_range": (75, 92),
        "description": "User executed privileged commands outside normal business hours via sudo.",
        "mitre": [MitreTag(tactic="Privilege Escalation", technique="Sudo and Sudo Caching", technique_id="T1548.003")],
        "tags": ["privilege-escalation", "sudo", "linux"],
    },
    {
        "title": "Phishing Email with Malicious Attachment",
        "alert_type": "phishing",
        "severity": Severity.HIGH,
        "risk_score_range": (65, 85),
        "description": "Email with suspicious macro-enabled Office document delivered and opened by user.",
        "mitre": [MitreTag(tactic="Initial Access", technique="Phishing", technique_id="T1566")],
        "tags": ["phishing", "email", "initial-access"],
    },
    {
        "title": "Ransomware — Mass File Encryption",
        "alert_type": "ransomware",
        "severity": Severity.CRITICAL,
        "risk_score_range": (95, 100),
        "description": "Rapid sequential file modification with known ransomware extension patterns detected.",
        "mitre": [MitreTag(tactic="Impact", technique="Data Encrypted for Impact", technique_id="T1486")],
        "tags": ["ransomware", "encryption", "impact"],
    },
    {
        "title": "Suspicious PowerShell Execution",
        "alert_type": "suspicious_script",
        "severity": Severity.MEDIUM,
        "risk_score_range": (50, 75),
        "description": "Obfuscated PowerShell command executed with encoded payload and network activity.",
        "mitre": [MitreTag(tactic="Execution", technique="Command and Scripting Interpreter: PowerShell", technique_id="T1059.001")],
        "tags": ["powershell", "execution", "obfuscation"],
    },
    {
        "title": "Insider Threat — Bulk Data Download",
        "alert_type": "insider_threat",
        "severity": Severity.HIGH,
        "risk_score_range": (72, 88),
        "description": "User downloaded an unusually large volume of sensitive files prior to resignation notice.",
        "mitre": [MitreTag(tactic="Collection", technique="Data from Local System", technique_id="T1005")],
        "tags": ["insider-threat", "data-theft", "dlp"],
    },
    {
        "title": "Port Scan — Internal Reconnaissance",
        "alert_type": "reconnaissance",
        "severity": Severity.MEDIUM,
        "risk_score_range": (40, 65),
        "description": "Sequential port scanning activity detected from compromised internal host.",
        "mitre": [MitreTag(tactic="Discovery", technique="Network Service Discovery", technique_id="T1046")],
        "tags": ["reconnaissance", "scanning", "discovery"],
    },
    {
        "title": "Cloud Credential Theft — AWS Keys Exposed",
        "alert_type": "cloud_threat",
        "severity": Severity.CRITICAL,
        "risk_score_range": (88, 100),
        "description": "AWS access keys found in public GitHub repository and used from anomalous IP.",
        "mitre": [MitreTag(tactic="Credential Access", technique="Steal Application Access Token", technique_id="T1528")],
        "tags": ["cloud", "aws", "credential-exposure"],
    },
    {
        "title": "Zero-Day Exploit Attempt",
        "alert_type": "exploit",
        "severity": Severity.CRITICAL,
        "risk_score_range": (92, 100),
        "description": "Exploit signature matching recently published CVE detected targeting web application.",
        "mitre": [MitreTag(tactic="Initial Access", technique="Exploit Public-Facing Application", technique_id="T1190")],
        "tags": ["exploit", "zero-day", "vulnerability"],
    },
]

USERS = [
    "alice@corp.com", "bob@corp.com", "carol@corp.com", "dave@corp.com",
    "eve@corp.com", "frank@corp.com", "grace@corp.com", "henry@corp.com",
    "SYSTEM", "svc-backup", "svc-deploy", "admin",
]

HOSTS = [
    "ws-alice-01", "ws-bob-02", "srv-dc-01", "srv-db-01", "srv-web-01",
    "srv-file-01", "laptop-carol", "kiosk-lobby", "srv-mail-01", "ci-runner-03",
]

GEO_SOURCES = [
    ("185.220.101.45", "Russia", "Moscow"),
    ("45.33.32.156", "United States", "Dallas"),
    ("103.21.244.0", "China", "Beijing"),
    ("185.156.73.54", "Romania", "Bucharest"),
    ("91.108.4.10", "Netherlands", "Amsterdam"),
    ("194.165.16.11", "Iran", "Tehran"),
    ("23.19.58.114", "Ukraine", "Kyiv"),
    ("172.98.193.43", "Germany", "Frankfurt"),
    ("10.0.14.22", "Internal", ""),
    ("192.168.5.101", "Internal", ""),
]

DEST_IPS = [
    "10.0.1.50", "10.0.2.100", "172.16.0.5", "192.168.1.1",
    "8.8.8.8", "1.1.1.1", "10.100.0.20",
]


def make_alert(hours_ago: float = 0, status: AlertStatus = AlertStatus.OPEN) -> Alert:
    template = random.choice(ALERT_TEMPLATES)
    src = random.choice(GEO_SOURCES)
    ts = (datetime.utcnow() - timedelta(hours=hours_ago)).isoformat() + "Z"
    risk = random.randint(*template["risk_score_range"])

    return Alert(
        id=str(uuid.uuid4()),
        title=template["title"],
        alert_type=template["alert_type"],
        timestamp=ts,
        risk_score=risk,
        severity=template["severity"],
        status=status,
        user=random.choice(USERS),
        host=random.choice(HOSTS),
        source_ip=src[0],
        dest_ip=random.choice(DEST_IPS),
        country=src[1],
        city=src[2],
        description=template["description"],
        mitre=template["mitre"],
        tags=template["tags"],
    )


def generate_seed_alerts(count: int = 40) -> list:
    alerts = []
    statuses = (
        [AlertStatus.OPEN] * 14 +
        [AlertStatus.ACKNOWLEDGED] * 8 +
        [AlertStatus.INVESTIGATING] * 6 +
        [AlertStatus.RESOLVED] * 10 +
        [AlertStatus.FALSE_POSITIVE] * 2
    )
    for i in range(count):
        hours = random.uniform(0, 23)
        status = statuses[i % len(statuses)]
        alerts.append(make_alert(hours_ago=hours, status=status))
    return alerts


def make_timeline_events(alert: Alert) -> list:
    events = []
    base_ts = datetime.fromisoformat(alert.timestamp.replace("Z", ""))

    steps = [
        {"offset": -30, "event_type": "network", "action": "Port scan initiated", "result": "open ports: 22,80,443,3389"},
        {"offset": -25, "event_type": "auth", "action": "Authentication attempt", "result": "failure x5"},
        {"offset": -20, "event_type": "auth", "action": "Authentication success", "result": "session created"},
        {"offset": -15, "event_type": "process", "action": "Malicious process spawned", "result": "cmd.exe → powershell.exe"},
        {"offset": -10, "event_type": "file", "action": "Sensitive file accessed", "result": "C:\\Users\\credentials.db"},
        {"offset": -5, "event_type": "network", "action": "C2 beacon established", "result": f"→ {alert.source_ip}:443"},
        {"offset": 0, "event_type": "alert", "action": "Alert triggered", "result": alert.title},
    ]
    for step in steps:
        ts = (base_ts + timedelta(minutes=step["offset"])).isoformat() + "Z"
        events.append(TimelineEvent(
            id=str(uuid.uuid4()),
            alert_id=alert.id,
            timestamp=ts,
            event_type=step["event_type"],
            actor=alert.user,
            target=alert.host,
            action=step["action"],
            result=step["result"],
            mitre=alert.mitre[0] if alert.mitre else None,
        ))
    return events
