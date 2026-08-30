from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from app.services.garuda_agent import analyze_telemetry

router = APIRouter(prefix="/api/garuda", tags=["garuda"])

class AnalyzeRequest(BaseModel):
    telemetry: Optional[Dict[str, Any]] = {}
    health: Optional[Dict[str, Any]] = {}
    faults: Optional[List[Any]] = []
    mission: Optional[Dict[str, Any]] = {}
    selectedCommand: Optional[str] = "ANALYZE ENGINE"

@router.post("/analyze")
async def analyze_telemetry_endpoint(req: AnalyzeRequest):
    data = req.model_dump()
    result_text = analyze_telemetry(data)
    
    return {
        "analysis": result_text
    }
