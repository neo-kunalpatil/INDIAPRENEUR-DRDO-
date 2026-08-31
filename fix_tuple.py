import re
with open("simulator/main.py", "r") as f:
    content = f.read()

# Fix the first insert (physics loop)
tuple_replace_1 = """(
                        packet.get("missionPhase", "GROUND_IDLE"), packet.get("rpm", 0), packet.get("throttle", 0),
                        packet.get("map", 0), packet.get("torque", 0), packet.get("power", 0),
                        packet.get("fuelFlow", 0), packet.get("fuelRemaining", 0), packet.get("egt", 0),
                        packet.get("cht", 0), packet.get("oilTemp", 0), packet.get("oilPressure", 0),
                        packet.get("batteryVoltage", 0), packet.get("alternatorVoltage", 0), packet.get("altitude", 0),
                        packet.get("airspeed", 0), packet.get("groundSpeed", 0), packet.get("verticalSpeed", 0),
                        packet.get("pitch", 0), packet.get("roll", 0), packet.get("yaw", 0), packet.get("heading", 0),
                        packet.get("oat", 0), packet.get("humidity", 0), packet.get("pressure", 0),
                        packet.get("windSpeed", 0), packet.get("windDirection", 0), packet.get("densityAltitude", 0),
                        packet.get("health", 100)
                    )"""

content = re.sub(r'\(\s*packet\.get\("missionPhase", "GROUND_IDLE"\).*?active_faults\s*\)', tuple_replace_1, content, flags=re.DOTALL)

with open("simulator/main.py", "w") as f:
    f.write(content)
print("Updated main.py schema tuple")
