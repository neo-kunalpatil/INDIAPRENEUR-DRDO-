import re
with open('simulator/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = """@app.get("/health")
async def get_health():
    return {"status": "ok"}"""

new = """@app.get("/")
async def root():
    return {"status": "alive"}

@app.get("/health")
async def get_health():
    return {"status": "ok"}"""

content = content.replace(old, new)

with open('simulator/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
