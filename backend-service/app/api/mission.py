from fastapi import APIRouter
from typing import Dict, Any
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Mission"])

@router.post("/mission")
async def post_mission(data: Dict[str, Any]):
    return await simulator_client.post_mission(data)
