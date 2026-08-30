import re

with open('main.py', 'r') as f:
    content = f.read()

new_mission = '''
@app.post("/api/mission")
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
    return {"status": "ok"}
'''

content = re.sub(
    r'@app\.post\("/api/mission"\)\s*async def receive_mission\(data: Dict\[str, Any\]\):\s*await ws_manager\.broadcast\("mission:update", data\)\s*return \{"status": "ok"\}',
    new_mission.strip(),
    content
)

with open('main.py', 'w') as f:
    f.write(content)
