from fastapi import APIRouter
from typing import Dict, Any
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Telemetry"])

@router.get("/telemetry/latest")
async def get_latest_telemetry():
    return await simulator_client.get_telemetry_latest()

@router.post("/telemetry")
async def post_telemetry(data: Dict[str, Any]):
    return await simulator_client.post_telemetry(data)

@router.get("/history")
async def get_history():
    return await simulator_client.get_history()
