import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from app.database.db import init_db, get_db_connection
from app.physics.engine_physics import EnginePhysics
from app.ai.ai_engine import AIEngine
from app.rul.rul_service import RULService
from app.websocket.connection_manager import ConnectionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SimulatorFastAPI")

ws_manager = ConnectionManager()
ai_engine = AIEngine(ws_manager)
rul_service = RULService(ws_manager)
physics = EnginePhysics()

latest_data: Dict[str, Any] = {}

# Background 10Hz physics loop
async def physics_loop():
    while True:
        physics.tick()
        await asyncio.sleep(0.1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing DRDO Digital Twin Simulator Database...")
    init_db()
    
    physics_task = asyncio.create_task(physics_loop())
    ai_task = asyncio.create_task(ai_engine.start())
    rul_task = asyncio.create_task(rul_service.start())
    
    yield
    
    physics_task.cancel()
    ai_task.cancel()
    rul_task.cancel()

app = FastAPI(
    title="DRDO MALE UAV Telemetry & Engine Simulator Backend",
    version="4.2.8",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/telemetry")
async def receive_telemetry(data: Dict[str, Any]):
    global latest_data
    latest_data = data
    await ws_manager.broadcast("telemetry:update", data)
    ai_engine.feed_data(data)
    rul_service.feed_data(data)
    
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO engine_telemetry (time, rpm, torque_nm, fuel_flow_lph, oil_temp_c, oil_pressure_kpa, egt_c, cht_c, battery_v, current_a, map_kpa, lambda, throttle_pct, load_pct, vib_x_g, vib_y_g, vib_z_g, health_score, mission_phase)
                    VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    data.get("rpm", 0), data.get("torque", 0), data.get("fuelFlow", 0), data.get("oilTemp", 0), data.get("oilPress", 0),
                    str(data.get("egt", 0)), str(data.get("cht", 0)), data.get("batteryV", 0), data.get("currentDraw", 0),
                    data.get("map", 0), data.get("lambda", 0), data.get("throttle", 0), data.get("loadPct", 0),
                    data.get("vibX", 0), data.get("vibY", 0), data.get("vibZ", 0), data.get("health", 100), data.get("missionPhase", "FLIGHT")
                ))
                conn.commit()
        except Exception:
            pass
        finally:
            conn.close()

    return {"status": "ok"}

@app.post("/api/mission")
async def receive_mission(data: Dict[str, Any]):
    await ws_manager.broadcast("mission:update", data)
    return {"status": "ok"}

@app.post("/api/faults")
async def receive_faults(data: Dict[str, Any]):
    await ws_manager.broadcast("fault:update", data)
    if "type" in data:
        fault_type = data["type"]
        if fault_type in physics.faults:
            physics.faults[fault_type] = data.get("active", True)
    return {"status": "ok"}

@app.post("/api/health")
async def receive_health(data: Dict[str, Any]):
    await ws_manager.broadcast("health:update", data)
    return {"status": "ok"}

@app.post("/api/fft")
async def receive_fft(data: Dict[str, Any]):
    await ws_manager.broadcast("fft:update", data)
    return {"status": "ok"}

@app.get("/api/telemetry/latest")
async def get_latest_telemetry():
    return latest_data or physics.state

@app.get("/api/rul")
async def get_rul():
    return {"status": "ok"}

@app.get("/api/degradation")
async def get_degradation():
    return {"status": "ok"}

@app.get("/api/reliability")
async def get_reliability():
    return {"status": "ok"}

@app.get("/api/maintenance")
async def get_maintenance():
    return {"status": "ok"}

@app.get("/api/mission-risk")
async def get_mission_risk():
    return {"status": "ok"}

@app.get("/api/history")
async def get_history():
    conn = get_db_connection()
    if not conn:
        return []
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM engine_telemetry ORDER BY time DESC LIMIT 1000")
            rows = cur.fetchall()
            return rows
    except Exception:
        return []
    finally:
        conn.close()

@app.get("/api/engine")
async def get_engine():
    return physics.state

@app.get("/api/environment")
async def get_environment():
    return physics.mission

@app.get("/api/alerts")
async def get_alerts():
    return {"alerts": []}

@app.get("/api/system")
async def get_system():
    return {"status": "HEALTHY", "version": "4.2.8"}

@app.get("/api/status")
async def get_status():
    return {"status": "ONLINE", "mode": "SIMULATION"}

@app.websocket("/ws")
@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await ws_manager.broadcast("telemetry:update", physics.state)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
