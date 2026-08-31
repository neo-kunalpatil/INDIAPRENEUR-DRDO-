import asyncio
import json
import os
import time
from pymavlink import mavutil
import websockets

BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", "ws://backend-service:8000/ws/telemetry_ingest")
MAVLINK_URI = os.getenv("MAVLINK_URI", "udpin:0.0.0.0:14550")

async def forward_telemetry():
    print(f"Starting MAVLink Bridge on {MAVLINK_URI}")
    
    # Wait a bit for PX4 to start
    await asyncio.sleep(5)
    
    master = mavutil.mavlink_connection(MAVLINK_URI)
    print("Waiting for heartbeat...")
    master.wait_heartbeat()
    print("Heartbeat received from PX4 SITL!")
    
    # Request data streams at 20Hz
    master.mav.request_data_stream_send(
        master.target_system, master.target_component,
        mavutil.mavlink.MAV_DATA_STREAM_ALL, 20, 1
    )
    
    while True:
        try:
            async with websockets.connect(BACKEND_WS_URL) as ws:
                print(f"Connected to backend {BACKEND_WS_URL}")
                while True:
                    msg = master.recv_match(
                        type=['GLOBAL_POSITION_INT', 'VFR_HUD', 'SYS_STATUS', 'MISSION_CURRENT'], 
                        blocking=False
                    )
                    
                    if not msg:
                        await asyncio.sleep(0.01)
                        continue
                    
                    payload = {}
                    msg_type = msg.get_type()
                    
                    if msg_type == 'GLOBAL_POSITION_INT':
                        payload = {
                            "lat": msg.lat / 1e7,
                            "lng": msg.lon / 1e7,
                            "altitude_ft": (msg.alt / 1000.0) * 3.28084,
                            "heading_deg": msg.hdg / 100.0 if msg.hdg != 65535 else 0.0
                        }
                    elif msg_type == 'VFR_HUD':
                        payload = {
                            "airspeed_kts": msg.airspeed * 1.94384,
                            "groundspeed_kts": msg.groundspeed * 1.94384,
                            "throttle_pct": msg.throttle
                        }
                    elif msg_type == 'SYS_STATUS':
                        payload = {
                            "battery_pct": msg.battery_remaining
                        }
                    elif msg_type == 'MISSION_CURRENT':
                        payload = {
                            "current_wp_index": msg.seq
                        }
                    
                    if payload:
                        await ws.send(json.dumps({"type": "MAVLINK", "data": payload}))
                        
        except Exception as e:
            print(f"WebSocket error: {e}, reconnecting in 5s...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(forward_telemetry())
