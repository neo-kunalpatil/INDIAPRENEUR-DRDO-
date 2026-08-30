with open('main.py', 'r') as f:
    content = f.read()

old = '''@app.post("/api/mission")
async def receive_mission(data: Dict[str, Any]):
    if "phase" in data:
        physics.mission["missionPhase"] = data["phase"]
    if "missionPhase" in data:
        physics.mission["missionPhase"] = data["missionPhase"]
    if "isActive" in data:
        physics.mission["isActive"] = data["isActive"]
        
    for k, v in data.items():
        if k in physics.mission:
            physics.mission[k] = v
            
    await ws_manager.broadcast("mission:update", data)
    return {"status": "ok"}'''

new = '''@app.post("/api/mission")
async def receive_mission(data: Dict[str, Any]):
    if "phase" in data:
        physics.mission["missionPhase"] = data["phase"]
    if "missionPhase" in data:
        physics.mission["missionPhase"] = data["missionPhase"]
    if "isActive" in data:
        physics.mission["isActive"] = bool(data["isActive"])
    if "status" in data:
        physics.mission["status"] = data["status"]
        # When START is pressed and status=RUNNING but isActive not sent, still activate
        if data["status"] == "RUNNING" and "isActive" not in data:
            physics.mission["isActive"] = True
        if data["status"] == "STOPPED":
            physics.mission["isActive"] = False
            physics.mission["missionPhase"] = "GROUND_IDLE"
        if data["status"] == "PAUSED":
            physics.mission["isActive"] = False
            
    for k, v in data.items():
        if k in physics.mission:
            physics.mission[k] = v

    state_summary = {
        "missionPhase": physics.mission["missionPhase"],
        "isActive": physics.mission["isActive"],
        "status": physics.mission.get("status", "STOPPED"),
    }
    await ws_manager.broadcast("mission:update", {**data, **state_summary})
    return {"status": "ok", **state_summary}'''

content = content.replace(old, new)

with open('main.py', 'w') as f:
    f.write(content)

print("Done")
