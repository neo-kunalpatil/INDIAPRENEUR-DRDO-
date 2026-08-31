import os
from typing import Dict, Any
from groq import Groq

# Initialize Groq client
api_key = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=api_key) if api_key else None

SYSTEM_PROMPT = """
You are GARUDA-AI.

Mission Intelligence Engine.

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

def analyze_telemetry(data: Dict[str, Any]) -> str:
    if not client:
        return "Mission Intelligence Service Temporarily Unavailable: GROQ_API_KEY not configured."
    
    command = data.get("selectedCommand", "ANALYZE ENGINE")
    
    try:
        response = client.chat.completions.create(
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
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=1200
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Mission Intelligence Service Temporarily Unavailable: {str(e)}"
