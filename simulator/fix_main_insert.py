import re

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
                        data.get("missionPhase", "STANDBY"), data.get("rpm", 0), data.get("throttle", 0),
                        data.get("map", 0), data.get("torque", 0), data.get("loadPct", 0),
                        data.get("fuelFlow", 0), data.get("fuelRemaining", 0), data.get("egt", 0),
                        data.get("cht", 0), data.get("oilTemp", 0), data.get("oilPressure", 0),
                        data.get("batteryVoltage", 0), data.get("alternatorVoltage", 0), data.get("altitude", 0),
                        data.get("airspeed", 0), data.get("groundSpeed", 0), data.get("verticalSpeed", 0),
                        data.get("pitch", 0), data.get("roll", 0), data.get("yaw", 0), data.get("heading", 0),
                        data.get("oat", 0), data.get("humidity", 0), data.get("pressure", 0),
                        data.get("windSpeed", 0), data.get("windDirection", 0), data.get("densityAltitude", 0),
                        data.get("health", 100), ""
                    ))
'''

# Find the execute block inside receive_telemetry
pattern = r'cur\.execute\("""\s*INSERT INTO engine_telemetry.*?conn\.commit\(\)'

content = re.sub(pattern, new_insert.strip() + '\n                conn.commit()', content, flags=re.DOTALL)

with open('main.py', 'w') as f:
    f.write(content)
