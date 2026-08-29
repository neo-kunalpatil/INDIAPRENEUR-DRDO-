# DRDO MALE UAV Digital Twin Simulator Backend (FastAPI)

Military-grade Python 3.12 FastAPI backend microservice for real-time engine telemetry, physics calculations, multi-agent AI diagnostics, and RUL forecasting.

---

## 🚀 How to Run Backend

```bash
cd simulator/backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Launch FastAPI Uvicorn Server
python main.py
```

- **OpenAPI Docs (Swagger):** `http://localhost:4000/docs`
- **Telemetry Streaming:** `ws://localhost:4000/stream`
