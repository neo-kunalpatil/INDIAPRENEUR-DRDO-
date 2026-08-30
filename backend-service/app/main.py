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
    allow_origins=["*"],
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
