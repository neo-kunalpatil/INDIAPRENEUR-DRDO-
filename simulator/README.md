# DRDO MALE UAV Telemetry & Engine Simulator (Python FastAPI Migration)

Production-ready Python FastAPI conversion of the Node.js/TypeScript UAV Digital Twin Telemetry & Engine Simulator.

---

## 🏛 System Mapping (Node.js $\rightarrow$ Python 3.12 FastAPI)

| Node.js / TypeScript Feature | Converted Python Module |
| :--- | :--- |
| `express` REST API | `FastAPI` (`main.py`) |
| `http` / `socket.io` / `ws` | `FastAPI WebSockets` (`ws_manager.py`) |
| `setInterval()` | `asyncio.create_task()` background loops |
| `pg` Pool | `psycopg2` / `asyncpg` (`db.py`) |
| `EnginePhysics` Class | `physics.py` (`EnginePhysics`) |
| `AIEngine` Anomaly & Prediction | `ai_engine.py` (`AIEngine`) |
| `RULService` & Degradation | `rul_service.py` (`RULService`) |

---

## 🚀 How to Run

```bash
cd simulator

# Install Python Dependencies
pip install -r requirements.txt

# Run FastAPI Server (Port 4000)
python main.py
```

Or run via Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 4000 --reload
```

---

## 📡 Identical API Contracts Preserved

- `POST /api/telemetry`
- `POST /api/mission`
- `POST /api/faults`
- `POST /api/health`
- `POST /api/fft`
- `GET /api/telemetry/latest`
- `GET /api/history`
- `WS /stream` or `/ws`
