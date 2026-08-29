from fastapi import APIRouter
from typing import Dict, Any
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Faults"])

@router.post("/faults")
async def post_faults(data: Dict[str, Any]):
    return await simulator_client.post_faults(data)
