from fastapi import APIRouter
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Environment"])

@router.get("/environment")
async def get_environment():
    return await simulator_client.get_environment()
