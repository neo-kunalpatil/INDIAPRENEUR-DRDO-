import re

# Backend service
with open('backend-service/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = """@app.get("/")
async def root():
    return {"status": "alive"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "backend-service", "version": "4.2.8"}"""

new = """@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "service": "DRDO Digital Twin Gateway",
        "status": "running"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok", "service": "backend-service", "version": "4.2.8"}"""

if old in content:
    content = content.replace(old, new)
    with open('backend-service/app/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched backend-service")
else:
    print("Could not find old string in backend-service")

# Simulator
with open('simulator/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_sim = """@app.get("/")
async def root():
    return {"status": "alive"}

@app.get("/health")
async def get_health():
    return {"status": "ok"}"""

new_sim = """@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "service": "DRDO Digital Twin Simulator",
        "status": "running"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
async def get_health():
    return {"status": "ok"}"""

if old_sim in content:
    content = content.replace(old_sim, new_sim)
    with open('simulator/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched simulator")
else:
    print("Could not find old string in simulator")
