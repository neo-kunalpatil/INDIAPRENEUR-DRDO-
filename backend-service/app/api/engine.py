from fastapi import APIRouter
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Engine"])

@router.get("/engine")
async def get_engine():
    return await simulator_client.get_engine()
