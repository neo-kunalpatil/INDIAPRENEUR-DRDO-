import re

with open('main.py', 'r') as f:
    content = f.read()

# Make sure time is imported in main.py
if 'import time' not in content:
    content = 'import time\n' + content

injection = '''conn.commit()
                if getattr(physics, 'stats', {}).get("triggerSave"):
                    physics.stats["triggerSave"] = False
                    dur = time.time() - physics.stats["startTime"]
                    fuel = physics.stats["fuelStart"] - physics.state["fuelRemaining"]
                    cur.execute("INSERT INTO mission_history (mission_phase, start_time, duration, fuel_consumed, max_egt, max_cht, max_rpm, min_health) VALUES (%s, to_timestamp(%s), %s, %s, %s, %s, %s, %s)", 
                        (physics.stats["phase"], physics.stats["startTime"], dur, fuel, physics.stats["maxEgt"], physics.stats["maxCht"], physics.stats["maxRpm"], physics.stats["minHealth"]))
                    conn.commit()
                    physics.stats["phase"] = packet.get("missionPhase", "GROUND_IDLE")
                    physics.stats["startTime"] = time.time()
                    physics.stats["fuelStart"] = physics.state["fuelRemaining"]
                    physics.stats["maxEgt"] = 0.0
                    physics.stats["maxCht"] = 0.0
                    physics.stats["maxRpm"] = 0.0
                    physics.stats["minHealth"] = 100.0
            except Exception'''

content = content.replace('conn.commit()\n            except Exception', injection)

with open('main.py', 'w') as f:
    f.write(content)
