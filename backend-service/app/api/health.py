from fastapi import APIRouter
from typing import Dict, Any
from app.services.simulator_client import simulator_client

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
async def get_health():
    return await simulator_client.get_health()

@router.post("/health")
async def post_health(data: Dict[str, Any]):
    return await simulator_client.post_health(data)

@router.post("/fft")
async def post_fft(data: Dict[str, Any]):
    return await simulator_client.post_fft(data)
