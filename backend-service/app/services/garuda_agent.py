import os
from typing import Dict, Any
from groq import Groq

# Initialize Groq client securely on backend
api_key = os.environ.get("GROQ_API_KEY", "") or os.environ.get("XAI_API_KEY", "gsk_3Onc0Ebnj6zZ8YpFdNZXYZ.....FYZsR67WBNaw0DQ4LU9ewBNg8u")
client = Groq(api_key=api_key) if api_key else None

SYSTEM_PROMPT = """
You are GARUDA-AI.

Enterprise Mission Intelligence Assistant.

Integrated with:
DRDO-ADE MALE UAV Digital Twin Platform.

You analyze:
- Engine telemetry
- Thermal data
- Vibration data
- Health metrics
- Fault states
- Mission data

Never act like a chatbot.
Never use casual language.
Always respond in military-grade operational format.

Ensure you strictly follow the format for the requested command:

If ANALYZE ENGINE:
GARUDA-AI > ENGINE ANALYSIS COMPLETE
STATUS: [GREEN/YELLOW/ORANGE/RED]
HEALTH INDEX: [XX %]
KEY FINDINGS:
• ...
THERMAL STATE: ...
VIBRATION STATE: ...
RISK LEVEL: ...
RECOMMENDATIONS:
1. 
CONFIDENCE: [XX %]

If MISSION READINESS:
MISSION READY: YES / NO
READINESS SCORE: XX %
GO / NO-GO DECISION
PRIMARY RISKS
RECOMMENDATIONS

If PREDICT FAILURE:
COMPONENT
FAILURE PROBABILITY
ESTIMATED RUL
SEVERITY
MAINTENANCE ACTION

If FAULT DIAGNOSIS:
FAULT DETECTED
SEVERITY
ROOT CAUSE
MISSION IMPACT
CORRECTIVE ACTION
CONFIDENCE

If GENERATE REPORT:
EXECUTIVE SUMMARY
TELEMETRY OVERVIEW
HEALTH ASSESSMENT
FAULT ANALYSIS
MISSION RISK
MAINTENANCE PLAN
FINAL DECISION
"""

from app.config import settings

def get_groq_client():
    key = settings.GROQ_API_KEY.strip() or os.environ.get("GROQ_API_KEY", "").strip() or os.environ.get("XAI_API_KEY", "").strip()
    if not key or key.startswith("gsk_3Onc0Ebnj6zZ8YpFdNZXYZ"):
        key = settings.GROQ_API_KEY.strip() or os.environ.get("GROQ_API_KEY", "").strip()
    return Groq(api_key=key) if key else None

def analyze_telemetry(data: Dict[str, Any]) -> str:
    current_client = get_groq_client()
    if not current_client:
        return "Mission Intelligence Service Temporarily Unavailable: GROQ_API_KEY not set on backend environment."
    
    command = data.get("selectedCommand") or data.get("command") or "ANALYZE ENGINE"
    models_to_try = [
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ]
    
    last_error = None
    for model_name in models_to_try:
        try:
            response = current_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": f"Command: {command}\n\nContext Data:\n{data}"
                    }
                ],
                model=model_name,
                temperature=0.2,
                max_tokens=1200
            )
            return response.choices[0].message.content
        except Exception as e:
            last_error = str(e)
            if "invalid_api_key" in last_error.lower() or "401" in last_error or "404" in last_error or "model_not_found" in last_error or "Invalid API Key" in last_error:
                return (
                    "GARUDA-AI > MISSION INTELLIGENCE SERVICE UNAVAILABLE\n\n"
                    "Cause:\nInvalid or Expired Groq API Key specified in `backend-service/.env`.\n\n"
                    "Recommended Action:\n"
                    "Please paste your valid Groq API Key into `backend-service/.env`:\n"
                    "GROQ_API_KEY=gsk_your_actual_groq_api_key_here\n\n"
                    "Then restart the backend process."
                )
            continue
            
    return f"Mission Intelligence Service Temporarily Unavailable: {last_error}"
