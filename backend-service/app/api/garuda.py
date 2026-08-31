from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from app.services.garuda_agent import analyze_telemetry

router = APIRouter(prefix="/api/garuda", tags=["garuda"])

class AnalyzeRequest(BaseModel):
    command: Optional[str] = None
    telemetry: Optional[Dict[str, Any]] = {}
    health: Optional[Dict[str, Any]] = {}
    faults: Optional[List[Any]] = []
    mission: Optional[Dict[str, Any]] = {}
    selectedCommand: Optional[str] = "ANALYZE ENGINE"

@router.post("/analyze")
async def analyze_telemetry_endpoint(req: AnalyzeRequest):
    data = req.model_dump()
    if req.command and not req.selectedCommand:
        data["selectedCommand"] = req.command
    result_text = analyze_telemetry(data)
    
    return {
        "analysis": result_text
    }

@router.get("/health")
async def garuda_health_endpoint():
    import sys, os
    from app.config import settings
    key = settings.GROQ_API_KEY.strip() or os.environ.get("GROQ_API_KEY", "").strip()
    return {
        "groqConfigured": bool(key),
        "envLoaded": True,
        "apiKeyExists": bool(key),
        "apiKeyLength": len(key),
        "apiKeyPrefix": f"{key[:8]}****" if len(key) >= 8 else "N/A",
        "pythonVersion": sys.version.split()[0]
    }
