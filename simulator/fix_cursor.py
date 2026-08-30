import re

with open('main.py', 'r') as f:
    content = f.read()

replacement = '''
                    if getattr(physics, 'stats', {}).get("triggerSave"):
                        physics.stats["triggerSave"] = False
                        dur = time.time() - physics.stats["startTime"]
                        fuel = physics.stats["fuelStart"] - physics.state["fuelRemaining"]
                        cur.execute("INSERT INTO mission_history (mission_phase, start_time, duration, fuel_consumed, max_egt, max_cht, max_rpm, min_health) VALUES (%s, to_timestamp(%s), %s, %s, %s, %s, %s, %s)", 
                            (physics.stats["phase"], physics.stats["startTime"], dur, fuel, physics.stats["maxEgt"], physics.stats["maxCht"], physics.stats["maxRpm"], physics.stats["minHealth"]))
                        physics.stats["phase"] = packet.get("missionPhase", "GROUND_IDLE")
                        physics.stats["startTime"] = time.time()
                        physics.stats["fuelStart"] = physics.state["fuelRemaining"]
                        physics.stats["maxEgt"] = 0.0
                        physics.stats["maxCht"] = 0.0
                        physics.stats["maxRpm"] = 0.0
                        physics.stats["minHealth"] = 100.0
                conn.commit()
                if False:
                    pass
'''

content = re.sub(r'conn\.commit\(\)\s*if getattr\(physics, \'stats\', \{\}\)\.get\("triggerSave"\):.*?physics\.stats\["minHealth"\] = 100\.0', replacement.strip(), content, flags=re.DOTALL)

with open('main.py', 'w') as f:
    f.write(content)
