# DRDO MALE UAV Main Backend Service Gateway

A production-grade Python 3.12 FastAPI central backend gateway serving as the **single entry point** for the Main Dashboard frontend.

---

## 🏛 Microservice Architecture & Data Flow

```text
Main Dashboard (React)
        │
        ▼ (HTTP REST & WebSockets on Port 8000)
Main Backend Gateway (`backend-service`)
        │
        ▼ (Proxied REST Requests & WebSocket Ingestion)
Simulator Microservice (`simulator` on Port 5000)
```

---

## 🚀 How to Run `backend-service`

```bash
cd backend-service

# Create & activate virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI Gateway (Port 8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **OpenAPI Gateway Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)
- **Dashboard WebSocket Endpoint:** `ws://localhost:8000/stream` or `ws://localhost:8000/ws`

---

## ⚙ Key Architecture Features

1. **SimulatorClient (`app/services/simulator_client.py`):** Reusable `httpx` async client configured via `.env` (`SIMULATOR_API=http://localhost:5000`). Handles timeout, offline status code translation (`503 Simulator service unavailable`), and error responses gracefully.
2. **SimulatorWebSocketClient (`app/services/websocket_client.py`):** Reconnecting `websockets` client maintaining a persistent connection to `SIMULATOR_WS=ws://localhost:5000/stream`. Ingests live telemetry packets and broadcasts them to dashboard subscribers via `dashboard_ws_manager`.
3. **Modular API Routers (`app/api/`):**
   - `/api/telemetry` & `/api/telemetry/latest`
   - `/api/engine`
   - `/api/environment`
   - `/api/mission`
   - `/api/faults`
   - `/api/health`, `/api/fft`
   - `/api/alerts`
   - `/api/history`
