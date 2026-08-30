import re
import json

with open('main.py', 'r') as f:
    content = f.read()

new_insert = '''
                    cur.execute("""
                        INSERT INTO engine_telemetry (
                            timestamp, mission, rpm, throttle_pct, map_kpa, torque_nm, power_pct,
                            fuel_flow_lph, fuel_remaining_l, egt_c, cht_c, oil_temp_c, oil_pressure_kpa,
                            battery_voltage, alternator_voltage, altitude_m, airspeed_kmh, groundspeed_kmh,
                            vertical_speed_ms, pitch_deg, roll_deg, yaw_deg, heading_deg, oat_c,
                            humidity_pct, pressure_kpa, wind_speed_kmh, wind_direction_deg,
                            density_altitude_m, health_score, active_faults
                        ) VALUES (
                            NOW(), %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s
                        )
                    """, (
                        packet.get("missionPhase", "STANDBY"), packet.get("rpm", 0), packet.get("throttle", 0),
                        packet.get("map", 0), packet.get("torque", 0), packet.get("loadPct", 0),
                        packet.get("fuelFlow", 0), packet.get("fuelRemaining", 0), packet.get("egt", 0),
                        packet.get("cht", 0), packet.get("oilTemp", 0), packet.get("oilPressure", 0),
                        packet.get("batteryVoltage", 0), packet.get("alternatorVoltage", 0), packet.get("altitude", 0),
                        packet.get("airspeed", 0), packet.get("groundSpeed", 0), packet.get("verticalSpeed", 0),
                        packet.get("pitch", 0), packet.get("roll", 0), packet.get("yaw", 0), packet.get("heading", 0),
                        packet.get("oat", 0), packet.get("humidity", 0), packet.get("pressure", 0),
                        packet.get("windSpeed", 0), packet.get("windDirection", 0), packet.get("densityAltitude", 0),
                        packet.get("health", 100), json.dumps([k for k, v in physics.faults.items() if v]) if 'physics' in globals() else ""
                    ))
'''

# Find the first try/except block for DB insert
pattern1 = r'try:\s*with conn\.cursor\(\) as cur:\s*cur\.execute\("""\s*INSERT INTO engine_telemetry[\s\S]*?conn\.commit\(\)'

content = re.sub(pattern1, new_insert.strip(), content, count=1)

# For the second one, we need to replace `packet` with `data` because it's in the receive_telemetry scope,
# and physics.faults might not be available or applicable, we can just use empty string or a default.
new_insert_2 = new_insert.replace('packet.get', 'data.get')
# replace the physics.faults bit with just ""
new_insert_2 = re.sub(r'json\.dumps.*?""', '""', new_insert_2)

content = re.sub(pattern1, new_insert_2.strip(), content, count=1)

with open('main.py', 'w') as f:
    f.write(content)
