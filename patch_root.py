import re
with open('backend-service/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = """@app.get("/health")
async def health_check():
    return {"status": "online", "service": "backend-service", "version": "4.2.8"}"""

new = """@app.get("/")
async def root():
    return {"status": "alive"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "backend-service", "version": "4.2.8"}"""

content = content.replace(old, new)

with open('backend-service/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
