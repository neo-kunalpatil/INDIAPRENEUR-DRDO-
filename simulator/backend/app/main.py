import asyncio
import logging
import urllib.parse
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from app.database.db import init_db
from app.database.connection import ENV_PATH, SAFE_DB_URL, CONNECTED_HOST, get_db_connection, release_db_connection, get_connection_pool
from app.database.repositories.telemetry_repository import TelemetryRepository
from app.database.repositories.mission_repository import MissionRepository
from app.database.repositories.fault_repository import FaultRepository
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

telemetry_repo = TelemetryRepository()
mission_repo = MissionRepository()
fault_repo = FaultRepository()

latest_data: Dict[str, Any] = {}

# Background 10Hz physics loop & WS broadcaster with non-blocking DB storage
async def physics_loop():
    loop = asyncio.get_running_loop()
    while True:
        physics.tick()
        # Feed live telemetry state into AI inference window
        ai_engine.feed_data(physics.state)
        # Non-blocking async DB write using executor
        loop.run_in_executor(None, telemetry_repo.insert_telemetry, physics.state)
        await ws_manager.broadcast("telemetry:update", physics.state)
        await asyncio.sleep(0.1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Initializing DRDO Digital Twin Database Storage strictly from {ENV_PATH} on {SAFE_DB_URL}...")
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

@app.get("/api/db/health")
async def get_db_health():
    conn = get_db_connection()
    pool_inst = get_connection_pool()
    pool_status = "ACTIVE (SimpleConnectionPool 1-20)" if pool_inst else "SINGLE_CONNECTION"
    
    if not conn:
        return {
            "status": "DISCONNECTED",
            "loaded_env_path": ENV_PATH,
            "resolved_database_url": SAFE_DB_URL,
            "connected_host": CONNECTED_HOST,
            "connection_pool_status": pool_status,
            "error": f"Failed to connect to Timescale Cloud using DATABASE_URL in {ENV_PATH}."
        }
    try:
        with conn.cursor() as cur:
            # Query Database Version & Connection Identity
            cur.execute("SELECT version(), current_database(), current_user, now();")
            ver_info = cur.fetchone()
            db_version = ver_info[0] if ver_info else "Unknown"
            curr_db = ver_info[1] if ver_info else "Unknown"
            curr_user = ver_info[2] if ver_info else "Unknown"

            # Check existing tables
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public';
            """)
            tables = [r[0] for r in cur.fetchall()]

            # Check Timescale Extension Status
            timescale_active = False
            try:
                cur.execute("SELECT extname FROM pg_extension WHERE extname = 'timescaledb';")
                timescale_active = len(cur.fetchall()) > 0
            except Exception:
                conn.rollback()

            # Check hypertables status
            hypertables_list = []
            try:
                cur.execute("SELECT hypertable_name FROM _timescaledb_catalog.hypertable;")
                hypertables_list = [r[0] for r in cur.fetchall()]
            except Exception:
                conn.rollback()

            # Count total telemetry rows & get last inserted timestamp
            total_rows = 0
            last_timestamp = None
            if "engine_telemetry" in tables:
                cur.execute("SELECT COUNT(*), MAX(time) FROM engine_telemetry;")
                row = cur.fetchone()
                total_rows = row[0] if row else 0
                last_timestamp = str(row[1]) if row and row[1] else None

            return {
                "status": "CONNECTED",
                "loaded_env_path": ENV_PATH,
                "resolved_database_url": SAFE_DB_URL,
                "connected_host": CONNECTED_HOST,
                "connected_user": curr_user,
                "connected_database": curr_db,
                "database_version": db_version,
                "timescale_extension_status": "ENABLED" if timescale_active else "DISABLED",
                "existing_tables": tables,
                "existing_hypertables": hypertables_list,
                "hypertable_status": "ACTIVE" if "engine_telemetry" in hypertables_list else "POSTGRES_STANDALONE",
                "total_telemetry_rows": total_rows,
                "last_inserted_timestamp": last_timestamp,
                "insert_rate": "10 Hz (10 packets/second)",
                "connection_pool_status": pool_status
            }
    except Exception as e:
        return {
            "status": "ERROR",
            "loaded_env_path": ENV_PATH,
            "resolved_database_url": SAFE_DB_URL,
            "connected_host": CONNECTED_HOST,
            "connection_pool_status": pool_status,
            "error": str(e)
        }
    finally:
        release_db_connection(conn)

@app.post("/api/telemetry")
async def receive_telemetry(data: Dict[str, Any]):
    global latest_data
    latest_data = data
    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, telemetry_repo.insert_telemetry, data)
    await ws_manager.broadcast("telemetry:update", data)
    ai_engine.feed_data(data)
    rul_service.feed_data(data)
    return {"status": "ok"}

@app.post("/api/mission")
async def receive_mission(data: Dict[str, Any]):
    if "command" in data:
        cmd = data["command"]
        if cmd == "START":
            physics.state["throttle_pct"] = 80.0
            physics.mission["mission_phase"] = "CLIMB"
        elif cmd == "PAUSE":
            physics.state["throttle_pct"] = 15.0
            physics.mission["mission_phase"] = "LOITER"
        elif cmd == "STOP":
            physics.state["throttle_pct"] = 0.0
            physics.mission["mission_phase"] = "GROUND"
        elif cmd == "RESUME":
            physics.state["throttle_pct"] = 65.0
            physics.mission["mission_phase"] = "CRUISE"
    if "phase" in data:
        physics.mission["mission_phase"] = data["phase"]
        if data["phase"] == "GROUND_IDLE":
            physics.state["throttle_pct"] = 10.0
        elif data["phase"] == "TAKEOFF":
            physics.state["throttle_pct"] = 100.0
        elif data["phase"] == "CLIMB":
            physics.state["throttle_pct"] = 85.0
        elif data["phase"] == "CRUISE":
            physics.state["throttle_pct"] = 65.0
        elif data["phase"] == "LOITER":
            physics.state["throttle_pct"] = 45.0
        elif data["phase"] == "DESCENT":
            physics.state["throttle_pct"] = 25.0
        elif data["phase"] == "LANDING":
            physics.state["throttle_pct"] = 15.0

    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, mission_repo.insert_mission_event, data)
    await ws_manager.broadcast("mission:update", data)
    return {
        "status": "ok",
        "missionPhase": physics.mission["mission_phase"],
        "isActive": data.get("isActive", True),
        "phase": physics.mission["mission_phase"]
    }

@app.post("/api/faults")
async def receive_faults(data: Dict[str, Any]):
    fault_type = data.get("type", "")
    active = data.get("active", True)
    severity = data.get("severity", "MEDIUM")

    if fault_type:
        physics.set_fault(fault_type, active, severity)

    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, fault_repo.insert_fault_event, data)
    await ws_manager.broadcast("fault:update", data)
    return {"status": "ok", "fault": fault_type, "active": active, "activeFaults": physics.faults}

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
    return telemetry_repo.get_history(1000)

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
