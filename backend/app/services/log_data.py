import random
import uuid
from datetime import datetime, timedelta

SOURCE_TYPES = [
    "firewall", "edr", "dns", "proxy", "auth", "cloud", "ids", "siem",
    "vpn", "dlp", "email", "waf", "k8s", "db", "endpoint",
]

# Maps source_type → data stream label shown in UI
DATA_STREAMS = {
    "firewall":  "palo-alto-fw-01",
    "edr":       "crowdstrike-falcon",
    "dns":       "bind-dns-internal",
    "proxy":     "zscaler-proxy",
    "auth":      "okta-sso",
    "cloud":     "aws-cloudtrail",
    "ids":       "snort-ids-dmz",
    "siem":      "splunk-correlation",
    "vpn":       "cisco-anyconnect",
    "dlp":       "symantec-dlp",
    "email":     "proofpoint-tap",
    "waf":       "cloudflare-waf",
    "k8s":       "k8s-audit-log",
    "db":        "oracle-db-audit",
    "endpoint":  "ms-defender-atp",
}

EVENT_TYPES = {
    "firewall":  ["ALLOW", "DENY", "DROP", "RESET", "CONN_CLOSE"],
    "edr":       ["process_create", "file_write", "registry_mod", "network_conn", "dll_load", "script_exec"],
    "dns":       ["query", "response", "nx_domain", "refused", "timeout"],
    "proxy":     ["GET", "POST", "CONNECT", "blocked", "allowed"],
    "auth":      ["login_success", "login_failure", "logout", "mfa_challenge", "password_reset", "token_issued"],
    "cloud":     ["AssumeRole", "CreateUser", "DeleteObject", "GetSecretValue", "PutBucketPolicy", "ListBuckets"],
    "ids":       ["alert", "drop", "pass", "reject"],
    "siem":      ["rule_match", "baseline_deviation", "correlation_hit", "enrichment"],
    "vpn":       ["connect", "disconnect", "auth_failure", "split_tunnel", "ip_assigned"],
    "dlp":       ["data_block", "data_allow", "sensitive_file_copy", "usb_transfer", "email_attach"],
    "email":     ["delivered", "blocked", "quarantine", "url_click", "attachment_scan"],
    "waf":       ["allowed", "blocked", "challenge", "sql_injection", "xss_attempt"],
    "k8s":       ["pod_create", "pod_delete", "exec_container", "secret_access", "rbac_violation"],
    "db":        ["SELECT", "INSERT", "UPDATE", "DELETE", "GRANT", "failed_login"],
    "endpoint":  ["malware_detected", "suspicious_activity", "remediation", "quarantine", "scan_complete"],
}

USERS = [
    "alice@corp.com", "bob@corp.com", "carol@corp.com", "dave@corp.com",
    "eve@corp.com", "SYSTEM", "svc-backup", "svc-deploy", "NT AUTHORITY\\SYSTEM",
    "root", "admin", "frank@corp.com",
]

HOSTS = [
    "ws-alice-01", "ws-bob-02", "srv-dc-01", "srv-db-01", "srv-web-01",
    "srv-file-01", "laptop-carol", "ci-runner-03", "srv-mail-01", "fw-edge-01",
]

SRC_IPS = [
    "192.168.1.10", "192.168.1.25", "10.0.0.5", "10.0.14.22",
    "185.220.101.45", "45.33.32.156", "103.21.244.0", "172.16.0.50",
    "192.168.5.101", "10.100.0.20", "91.108.4.10", "8.8.8.8",
]

DEST_IPS = [
    "10.0.1.50", "10.0.2.100", "172.16.0.5", "192.168.1.1",
    "1.1.1.1", "8.8.8.8", "10.100.0.20", "104.21.44.55",
]

PROCESSES = [
    "powershell.exe", "cmd.exe", "python3", "bash", "svchost.exe",
    "chrome.exe", "explorer.exe", "lsass.exe", "wscript.exe", "mshta.exe",
]

DNS_DOMAINS = [
    "corp.internal", "update.microsoft.com", "evil-c2.ru", "cdn.cloudflare.com",
    "api.github.com", "pastebin.com", "raw.githubusercontent.com",
    "xn--malware.ru", "mail.corp.com", "auth.okta.com",
]

LOG_MESSAGES = {
    "firewall":  lambda e, src, dst: f"src={src} dst={dst} action={e} proto=TCP dport={random.choice([22,80,443,3389,8080,445])} bytes={random.randint(64,65535)}",
    "edr":       lambda e, src, _: f"process={random.choice(PROCESSES)} event={e} pid={random.randint(100,9999)} user={random.choice(USERS)}",
    "dns":       lambda e, src, _: f"src={src} query={random.choice(DNS_DOMAINS)} type={random.choice(['A','AAAA','TXT','MX','CNAME'])} result={e}",
    "proxy":     lambda e, src, dst: f"src={src} dst={dst} method={e} url=https://{random.choice(DNS_DOMAINS)}/path status={random.choice([200,301,403,404,500])} bytes={random.randint(512,10485760)}",
    "auth":      lambda e, src, _: f"user={random.choice(USERS)} src={src} event={e} mfa={random.choice(['true','false'])} agent=Mozilla/5.0",
    "cloud":     lambda e, src, _: f"principal={random.choice(USERS)} action={e} resource=arn:aws:s3:::bucket-{random.randint(1,9)} src={src} region={random.choice(['us-east-1','eu-west-1','ap-southeast-1'])}",
    "ids":       lambda e, src, dst: f"src={src} dst={dst} signature_id={random.randint(1000,9999)} severity={random.choice(['low','medium','high','critical'])} action={e}",
    "siem":      lambda e, src, _: f"rule_id={random.randint(100,999)} event={e} score={random.randint(10,100)} src={src} analyst=unassigned",
    "vpn":       lambda e, src, _: f"user={random.choice(USERS)} src={src} event={e} tunnel={random.choice(['split','full'])} assigned_ip=10.8.{random.randint(0,255)}.{random.randint(1,254)}",
    "dlp":       lambda e, src, _: f"user={random.choice(USERS)} src={src} event={e} policy=PII-{random.randint(1,5)} file={random.choice(['report.xlsx','credentials.csv','hr_data.zip','design.pdf'])} size={random.randint(1,50)}MB",
    "email":     lambda e, src, _: f"from={random.choice(USERS)} to={random.choice(USERS)} subject=Re:Q{random.randint(1,4)}-{random.choice(['budget','report','review'])} event={e} threat_type={random.choice(['phishing','malware','spam','clean'])}",
    "waf":       lambda e, src, dst: f"src={src} dst={dst} event={e} rule_id=WAF-{random.randint(1000,9999)} uri=/api/{random.choice(['login','admin','upload','search'])} method={random.choice(['GET','POST','PUT'])}",
    "k8s":       lambda e, src, _: f"user={random.choice(USERS)} namespace={random.choice(['default','kube-system','prod','staging'])} resource={random.choice(['pod','secret','configmap','serviceaccount'])} verb={e}",
    "db":        lambda e, src, _: f"user={random.choice(USERS)} src={src} op={e} table={random.choice(['users','payments','secrets','audit_log','sessions'])} rows={random.randint(1,50000)} db=prod",
    "endpoint":  lambda e, src, _: f"host={random.choice(HOSTS)} user={random.choice(USERS)} event={e} file={random.choice(['svchost.exe','powershell.exe','unknown.dll','dropper.bat'])} sha256={uuid.uuid4().hex[:16]}",
}

SEVERITY_LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
SEVERITY_WEIGHTS = [0.3, 0.4, 0.15, 0.1, 0.05]


def make_log(hours_ago: float = 0) -> dict:
    source_type = random.choice(SOURCE_TYPES)
    event_type = random.choice(EVENT_TYPES[source_type])
    src_ip = random.choice(SRC_IPS)
    dst_ip = random.choice(DEST_IPS)
    ts = (datetime.utcnow() - timedelta(hours=hours_ago, seconds=random.randint(0, 3599))).isoformat() + "Z"
    severity = random.choices(SEVERITY_LEVELS, weights=SEVERITY_WEIGHTS)[0]
    message = LOG_MESSAGES[source_type](event_type, src_ip, dst_ip)
    data_stream = DATA_STREAMS[source_type]

    return {
        "id": str(uuid.uuid4()),
        "timestamp": ts,
        "source_type": source_type,
        "data_stream": data_stream,
        "event_type": event_type,
        "severity": severity,
        "source_ip": src_ip,
        "dest_ip": dst_ip,
        "host": random.choice(HOSTS),
        "user": random.choice(USERS) if random.random() > 0.3 else None,
        "message": message,
        "raw": {
            "stream": data_stream,
            "source": source_type,
            "event": event_type,
            "src": src_ip,
            "dst": dst_ip,
            "ts": ts,
            "severity": severity,
            "extra": {k: v for k, v in {
                "bytes": random.randint(64, 1048576),
                "duration_ms": random.randint(1, 5000),
                "proto": random.choice(["TCP", "UDP", "ICMP"]),
                "port": random.choice([22, 80, 443, 3389, 8080, 445, 53]),
            }.items() if random.random() > 0.4},
        },
    }


def generate_seed_logs(count: int = 500) -> list:
    logs = []
    for _ in range(count):
        hours = random.uniform(0, 24)
        logs.append(make_log(hours_ago=hours))
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return logs
