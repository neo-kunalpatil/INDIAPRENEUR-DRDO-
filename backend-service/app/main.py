import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.websocket_client import simulator_ws_client
from app.websocket.connection_manager import dashboard_ws_manager

from app.api.telemetry import router as telemetry_router
from app.api.engine import router as engine_router
from app.api.environment import router as environment_router
from app.api.mission import router as mission_router
from app.api.faults import router as faults_router
from app.api.health import router as health_router
from app.api.alerts import router as alerts_router
from app.api.garuda import router as garuda_router

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger("MainBackendService")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Main Backend Service Gateway...")
    
    ts_url = getattr(settings, "TIMESCALE_DATABASE_URL", None)
    if ts_url:
        try:
            # Mask format: postgres://user:*****@host:port/db
            parts = ts_url.split(":", 2)
            if len(parts) == 3 and "@" in parts[2]:
                creds, rest = parts[2].split("@", 1)
                masked = f"{parts[0]}:{parts[1]}:*****@{rest}"
            else:
                masked = "*****"
        except:
            masked = "*****"
        logger.info(f"Loaded TIMESCALE_DATABASE_URL: {masked}")
    else:
        logger.warning("TIMESCALE_DATABASE_URL is not set!")
    ws_task = asyncio.create_task(simulator_ws_client.start())
    yield
    logger.info("Shutting down Main Backend Service Gateway...")
    simulator_ws_client.stop()
    ws_task.cancel()

app = FastAPI(
    title="DRDO MALE UAV Main Backend Gateway",
    version="4.2.8",
    description="Central Orchestrator microservice bridging the Main Dashboard and Simulator Service.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://simulator-ashen.vercel.app",
        "https://indiapreneur-drdo-1.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST Routers
app.include_router(telemetry_router)
app.include_router(engine_router)
app.include_router(environment_router)
app.include_router(mission_router)
app.include_router(faults_router)
app.include_router(health_router)
app.include_router(alerts_router)
app.include_router(garuda_router)

@app.get("/api/system/garuda-health")
async def system_garuda_health():
    from app.api.garuda import garuda_health_endpoint
    return await garuda_health_endpoint()

@app.get("/api/system/startup-state")
async def get_system_startup_state():
    """Single unified restoration endpoint for GCS initialization without zero-flashes"""
    from app.repositories import TelemetryRepository, FaultRepository
    telemetry_repo = TelemetryRepository()
    fault_repo = FaultRepository()

    latest_telemetry = telemetry_repo.get_latest() or {
        "rpm": 5200,
        "map_kpa": 98.4,
        "cht_c": [112.5, 114.2, 118.0, 111.8],
        "egt_c": [760, 765, 782, 758],
        "oil_temp_c": 106.2,
        "oil_pressure_kpa": 430.0,
        "fuel_flow_lph": 24.5,
        "turbochargerRpm": 114500,
        "turbo_boost": 0.90,
        "vib_z_g": 0.23,
        "knockIndex": 0.12,
        "health_score": 88.4,
        "rul_hours": 142.6
    }

    active_faults = fault_repo.get_active_faults()

    return {
        "systemReady": True,
        "timestamp": latest_telemetry.get("timestamp") or latest_telemetry.get("time"),
        "telemetry": latest_telemetry,
        "faults": active_faults,
        "activeFaults": active_faults,
        "mission": {
            "id": "MSN-IND-7701",
            "name": "OPERATION INDRADHANUSH",
            "profile": "HIGH_ALTITUDE_LOITER",
            "targetAltitudeFt": 22450,
            "targetSpeedKts": 118,
            "decision": "GO_FLIGHT",
            "riskScore": 18.2
        },
        "predictions": {
            "predictedRulHours": 142.6,
            "confidenceScore": 98.7,
            "shapAnomalyScore": 0.014,
            "conceptDriftIndex": 0.002,
            "topRiskFactor": "Cylinder #3 CHT Thermal Peak"
        },
        "digitalTwin": {
            "scadaSyncConfidence": 98.7,
            "activeLayer": "THERMAL",
            "selectedComponent": "cylinder_3",
            "transparentMode": False,
            "explodedMode": False
        },
        "fleet": [
            {
                "id": "UAV-TAPAS-201",
                "callsign": "TAPAS-BH-201 (GARUDA-1)",
                "model": "DRDO TAPAS-BH-201 MALE UAV",
                "status": "ACTIVE_MISSION",
                "altitudeFt": 22450,
                "airspeedKts": 118,
                "fuelRemainingKg": 184.5,
                "engineHealthIndex": 88.4,
                "missionRiskScore": 18.2,
                "twinConfidenceScore": 98.7,
                "predictedRulHours": 142.6,
                "activeFaultsCount": len(active_faults)
            }
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "online", "service": "backend-service", "version": "4.2.8"}

@app.websocket("/ws")
@app.websocket("/stream")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    await dashboard_ws_manager.connect(websocket)
    try:
        while True:
            # Maintain active connection and listen for client messages
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        dashboard_ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
