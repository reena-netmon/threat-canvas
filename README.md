# 🛡️ SOC Telemetry Platform

Real-time cybersecurity threat detection, incident response, and risk analytics.

## Quick Start

### Prerequisites
- Linux (Ubuntu/Debian)
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+

### Setup

1. Start Docker services:
```bash
docker-compose up -d
docker-compose ps  # Verify all healthy
```

2. Setup backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Start backend (Terminal 1):
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. Setup and start frontend (Terminal 2):
```bash
cd frontend
npm install
npm run dev
```

5. Open in browser:
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

## Testing

Click "+ Create Test Alert" on the dashboard to create a mock alert.

## Architecture