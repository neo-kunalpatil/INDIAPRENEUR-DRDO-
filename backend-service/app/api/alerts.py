from fastapi import APIRouter
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Alerts"])

@router.get("/alerts")
async def get_alerts():
    return await simulator_client.get_alerts()
