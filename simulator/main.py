import time
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional

from db import init_db, get_db_connection
from physics import EnginePhysics
from ai_engine import AIEngine
from rul_service import RULService
from ws_manager import ConnectionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SimulatorFastAPI")

ws_manager = ConnectionManager()
ai_engine = AIEngine(ws_manager)
rul_service = RULService(ws_manager)
physics = EnginePhysics()

latest_data: Dict[str, Any] = {}

# Background tick loop for physics simulation
async def physics_loop():
    while True:
        physics.tick()
        packet = {**physics.get_telemetry(), **physics.mission, **ai_engine.ai_state}
        packet["missionPhase"] = physics.mission.get("missionPhase", "GROUND_IDLE")
        packet["missionStatus"] = physics.mission.get("status", "STOPPED")
        
        await ws_manager.broadcast("telemetry:update", packet)
        ai_engine.feed_data(packet)
        rul_service.feed_data(packet)
        
        conn = get_db_connection()
        if conn:
            try:
                import json as _json
                active_faults = _json.dumps([k for k, v in physics.faults.items() if v])
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO engine_telemetry (
                            time, mission_phase, rpm, throttle_pct, map_kpa, torque_nm, power_kw,
                            fuel_flow_lph, fuel_remaining_l, egt_c, cht_c, oil_temp_c, oil_press_kpa,
                            battery_v, alternator_v, altitude_m, airspeed_mps, ground_speed_mps,
                            vertical_speed_mps, pitch_deg, roll_deg, yaw_deg, heading_deg, oat_c,
                            humidity_pct, pressure_kpa, wind_speed_mps, wind_direction_deg,
                            density_altitude_m, health_score
                        ) VALUES (
                            NOW(), %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s
                        )
                    """, (
                        packet.get("missionPhase", "GROUND_IDLE"), packet.get("rpm", 0), packet.get("throttle", 0),
                        packet.get("map", 0), packet.get("torque", 0), packet.get("power", 0),
                        packet.get("fuelFlow", 0), packet.get("fuelRemaining", 0), packet.get("egt", 0),
                        packet.get("cht", 0), packet.get("oilTemp", 0), packet.get("oilPressure", 0),
                        packet.get("batteryVoltage", 0), packet.get("alternatorVoltage", 0), packet.get("altitude", 0),
                        packet.get("airspeed", 0), packet.get("groundSpeed", 0), packet.get("verticalSpeed", 0),
                        packet.get("pitch", 0), packet.get("roll", 0), packet.get("yaw", 0), packet.get("heading", 0),
                        packet.get("oat", 0), packet.get("humidity", 0), packet.get("pressure", 0),
                        packet.get("windSpeed", 0), packet.get("windDirection", 0), packet.get("densityAltitude", 0),
                        packet.get("health", 100)
                    ))
                    
                    # Mission history: save when phase transitions
                    if getattr(physics, 'stats', {}).get("triggerSave"):
                        old_phase = physics.stats["phase"]
                        physics.stats["triggerSave"] = False
                        physics.stats["phase"] = packet.get("missionPhase", "GROUND_IDLE")
                        dur = time.time() - physics.stats["startTime"]
                        fuel = physics.stats["fuelStart"] - physics.state["fuelRemaining"]
                        cur.execute(
                            "INSERT INTO mission_history (mission_phase, start_time, duration, fuel_consumed, max_egt, max_cht, max_rpm, min_health) VALUES (%s, to_timestamp(%s), %s, %s, %s, %s, %s, %s)",
                            (old_phase, physics.stats["startTime"], dur, fuel,
                             physics.stats["maxEgt"], physics.stats["maxCht"],
                             physics.stats["maxRpm"], physics.stats["minHealth"])
                        )
                        physics.stats["startTime"] = time.time()
                        physics.stats["fuelStart"] = physics.state["fuelRemaining"]
                        physics.stats["maxEgt"] = 0.0
                        physics.stats["maxCht"] = 0.0
                        physics.stats["maxRpm"] = 0.0
                        physics.stats["minHealth"] = 100.0
                        
                conn.commit()
            except Exception as e:
                import traceback; traceback.print_exc()
            finally:
                conn.close()
                
        await asyncio.sleep(0.1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing DRDO Digital Twin Simulator Database...")
    init_db()
    
    physics_task = asyncio.create_task(physics_loop())
    ai_task = asyncio.create_task(ai_engine.start())
    rul_task = asyncio.create_task(rul_service.start())
    
    yield
    
    # Shutdown
    physics_task.cancel()
    ai_task.cancel()
    rul_task.cancel()

app = FastAPI(
    title="DRDO MALE UAV Engine & Telemetry Simulator",
    version="4.2.8",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://simulator-ashen.vercel.app",
        "https://indiapreneur-drdo-1.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_origin_regex="https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST APIs
@app.post("/api/telemetry")
async def receive_telemetry(data: Dict[str, Any]):
    global latest_data
    latest_data = data
    await ws_manager.broadcast("telemetry:update", data)
    ai_engine.feed_data(data)
    rul_service.feed_data(data)
    
    # Optional Database Persistence
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                        INSERT INTO engine_telemetry (
                            timestamp, mission, rpm, throttle_pct, map_kpa, torque_nm, power_pct,
                            fuel_flow_lph, fuel_remaining_l, egt_c, cht_c, oil_temp_c, oil_pressure_kpa,
                            battery_voltage, alternator_voltage, altitude_m, airspeed_kmh, groundspeed_kmh,
                            vertical_speed_ms, pitch_deg, roll_deg, yaw_deg, heading_deg, oat_c,
                            humidity_pct, pressure_kpa, wind_speed_kmh, wind_direction_deg,
                            density_altitude_m, health_score, active_faults
                        ) VALUES (
                            NOW(), %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s
                        )
                    """, (
                        data.get("missionPhase", "STANDBY"), data.get("rpm", 0), data.get("throttle", 0),
                        data.get("map", 0), data.get("torque", 0), data.get("loadPct", 0),
                        data.get("fuelFlow", 0), data.get("fuelRemaining", 0), data.get("egt", 0),
                        data.get("cht", 0), data.get("oilTemp", 0), data.get("oilPressure", 0),
                        data.get("batteryVoltage", 0), data.get("alternatorVoltage", 0), data.get("altitude", 0),
                        data.get("airspeed", 0), data.get("groundSpeed", 0), data.get("verticalSpeed", 0),
                        data.get("pitch", 0), data.get("roll", 0), data.get("yaw", 0), data.get("heading", 0),
                        data.get("oat", 0), data.get("humidity", 0), data.get("pressure", 0),
                        data.get("windSpeed", 0), data.get("windDirection", 0), data.get("densityAltitude", 0),
                        data.get("health", 100), __import__("json").dumps([k for k, v in physics.faults.items() if v])
                    ))
                conn.commit()
        except Exception:
            pass
        finally:
            conn.close()

    return {"status": "ok"}

@app.post("/api/mission")
async def receive_mission(data: Dict[str, Any]):
    if "phase" in data:
        physics.mission["missionPhase"] = data["phase"]
    if "missionPhase" in data:
        physics.mission["missionPhase"] = data["missionPhase"]
    if "isActive" in data:
        physics.mission["isActive"] = bool(data["isActive"])
    if "status" in data:
        physics.mission["status"] = data["status"]
        # When START is pressed and status=RUNNING but isActive not sent, still activate
        if data["status"] == "RUNNING" and "isActive" not in data:
            physics.mission["isActive"] = True
        if data["status"] == "STOPPED":
            physics.mission["isActive"] = False
            physics.mission["missionPhase"] = "GROUND_IDLE"
        if data["status"] == "PAUSED":
            physics.mission["isActive"] = False
            
    for k, v in data.items():
        if k in physics.mission:
            physics.mission[k] = v

    state_summary = {
        "missionPhase": physics.mission["missionPhase"],
        "isActive": physics.mission["isActive"],
        "status": physics.mission.get("status", "STOPPED"),
    }
    await ws_manager.broadcast("mission:update", {**data, **state_summary})
    return {"status": "ok", **state_summary}

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
    deg = rul_service.deg_engine.state
    max_deg = max(deg.values())
    rul_hours = max(0.0, (100.0 - max_deg) * 5.5)
    return {
        "rul_hours": rul_hours,
        "rul_cycles": int(rul_hours / 2.5),
        "confidence": 92.5,
        "predicted_failure": "Turbo Failure" if max_deg == deg["turbo"] else ("Thermal Runaway" if max_deg == deg["thermal"] else "None"),
        "opHours": rul_service.op_hours
    }

@app.get("/api/degradation")
async def get_degradation():
    return rul_service.deg_engine.state

@app.get("/api/reliability")
async def get_reliability():
    return rul_service.rel_engine.calculate(rul_service.deg_engine.state)

@app.get("/api/maintenance")
async def get_maintenance():
    return {"actions": rul_service.planner.plan(rul_service.deg_engine.state)}

@app.get("/api/mission-risk")
async def get_mission_risk():
    rel = rul_service.rel_engine.calculate(rul_service.deg_engine.state)
    return rul_service.risk_engine.evaluate(physics.get_telemetry(), rel["reliability_score"])

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
    alerts = [{"type": k, "severity": "CRITICAL" if k in ["turboFailure", "overheat", "oilPressureLoss"] else "WARNING"} 
              for k, v in physics.faults.items() if v]
    return {"alerts": alerts}

@app.get("/api/system")
async def get_system():
    return {"status": "HEALTHY", "version": "4.2.8"}

@app.get("/health")
async def get_health():
    return {"status": "ok"}

@app.get("/api/status")
async def get_status():
    return {"status": "ONLINE", "mode": "SIMULATION"}

# WebSocket Endpoint
@app.websocket("/ws")
@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle socket messages identical to Socket.io / ws INGEST
            await ws_manager.broadcast("telemetry:update", physics.get_telemetry())
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 4000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
