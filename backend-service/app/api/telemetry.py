from fastapi import APIRouter
from typing import Dict, Any, List
from app.repositories import TelemetryRepository
from app.database.telemetry_db import check_timescale_health

router = APIRouter(prefix="/api/v1", tags=["Telemetry V1"])
telemetry_repo = TelemetryRepository()

@router.get("/telemetry/latest")
async def get_latest_telemetry_v1():
    return telemetry_repo.get_latest()

@router.get("/telemetry/history")
async def get_history_v1():
    return telemetry_repo.get_history(1000)

@router.get("/telemetry/engine")
async def get_engine_v1():
    latest = telemetry_repo.get_latest()
    return {
        "rpm": latest.get("rpm", 0),
        "torque_nm": latest.get("torque_nm", 0),
        "power_kw": latest.get("power_kw", 0),
        "throttle_pct": latest.get("throttle_pct", 0),
        "load_pct": latest.get("load_pct", 0),
        "map_kpa": latest.get("map_kpa", 0),
        "fuel_flow_lph": latest.get("fuel_flow_lph", 0),
        "oil_pressure_kpa": latest.get("oil_pressure_kpa", 0),
        "oil_temp_c": latest.get("oil_temp_c", 0),
        "egt_c": latest.get("egt_c", 0),
        "cht_c": latest.get("cht_c", 0)
    }

@router.get("/telemetry/environment")
async def get_environment_v1():
    return telemetry_repo.get_environment()

@router.get("/telemetry/vibration")
async def get_vibration_v1():
    return telemetry_repo.get_vibration()

@router.get("/system/db")
async def get_system_db_health():
    return check_timescale_health()
