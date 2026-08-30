import re

with open('main.py', 'r') as f:
    content = f.read()

# Define the exact new query and values for physics_loop
new_query = '''"""
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
                        packet.get("health", 100), str([k for k, v in physics.faults.items() if v]) if 'physics' in globals() else ""
                    )'''

# Replace the physics loop query
content = re.sub(
    r'"""\s*INSERT INTO engine_telemetry \([\s\S]*?\)\s*""", \([\s\S]*?\)',
    new_query.replace('\\', '\\\\'),
    content,
    count=1
)

new_query_2 = new_query.replace('packet.get', 'data.get').replace('str([k for k, v in physics.faults.items() if v]) if \'physics\' in globals() else ""', '""')

content = re.sub(
    r'"""\s*INSERT INTO engine_telemetry \([\s\S]*?\)\s*""", \([\s\S]*?\)',
    new_query_2.replace('\\', '\\\\'),
    content,
    count=1
)


with open('main.py', 'w') as f:
    f.write(content)
