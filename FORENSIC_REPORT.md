# GARUDA-AI PHASE X.4 – FULL FORENSIC RUNTIME VERIFICATION

## SECTION 1 – ACTIVE API INVENTORY

- **Main Backend Health**: {'status': 'online', 'service': 'backend-service', 'version': '4.2.8'}

- **Simulator Backend Health**: Error: HTTP Error 404: Not Found

## SECTION 2 – WEBSOCKET TRACE

Tracing `ws://127.0.0.1:8000/stream`...

**Msg 1:** `{"topic": "telemetry:update", "type": "telemetry:update", "payload": {"rpm": 1553.3749787666027, "raw_rpm": 1553.3749787666027, "throttle": 10.0, "throttle_pct": 10.0, "map": 73.8, "map_kpa": 73.8, "raw_map": 73.8, "fuelFlow": 9.335261708154187, "fuel_flow_lph": 9.335261708154187, "fuelRemaining": 1...`

**Msg 2:** `{"topic": "telemetry:update", "type": "telemetry:update", "payload": {"rpm": 1553.8151907236993, "raw_rpm": 1553.8151907236993, "throttle": 10.0, "throttle_pct": 10.0, "map": 73.8, "map_kpa": 73.8, "raw_map": 73.8, "fuelFlow": 9.329426596227345, "fuel_flow_lph": 9.329426596227345, "fuelRemaining": 1...`

Tracing `ws://127.0.0.1:4000/stream`...

**Msg 1:** `{"topic": "telemetry:update", "type": "telemetry:update", "payload": {"rpm": 1554.3490857057136, "raw_rpm": 1554.3490857057136, "throttle": 10.0, "throttle_pct": 10.0, "map": 73.8, "map_kpa": 73.8, "raw_map": 73.8, "fuelFlow": 9.274804231939607, "fuel_flow_lph": 9.274804231939607, "fuelRemaining": 1...`

**Msg 2:** `{"topic": "telemetry:update", "type": "telemetry:update", "payload": {"rpm": 1553.76721708487, "raw_rpm": 1553.76721708487, "throttle": 10.0, "throttle_pct": 10.0, "map": 73.8, "map_kpa": 73.8, "raw_map": 73.8, "fuelFlow": 9.364605489704088, "fuel_flow_lph": 9.364605489704088, "fuelRemaining": 146.5...`

## SECTION 7 – FUEL SYSTEM AUDIT

t=0: Remaining=146.59012923756913, Flow=9.218178219170166

t=1: Remaining=146.58987376865667, Flow=9.196880848664636

t=2: Remaining=146.58961727976597, Flow=9.233600064997145

## SECTION 9 – DATABASE AUDIT

```json
{
  "error": "connection to server at \"localhost\" (::1), port 5432 failed: FATAL:  password authentication failed for user \"postgres\"\n"
}
```
