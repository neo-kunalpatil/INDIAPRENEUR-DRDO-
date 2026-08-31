import re
with open('backend-service/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = """async def lifespan(app: FastAPI):
    logger.info("Starting Main Backend Service Gateway...")"""
new = """async def lifespan(app: FastAPI):
    logger.info("Starting Main Backend Service Gateway...")
    
    ts_url = getattr(settings, "TIMESCALE_DATABASE_URL", None)
    if ts_url:
        try:
            # Mask format: postgres://user:*****@host:port/db
            parts = ts_url.split(":", 2)
            if len(parts) == 3 and "@" in parts[2]:
                creds, rest = parts[2].split("@", 1)
                masked = f"{parts[0]}:{parts[1]}:*****@{rest}"
            else:
                masked = "*****"
        except:
            masked = "*****"
        logger.info(f"Loaded TIMESCALE_DATABASE_URL: {masked}")
    else:
        logger.warning("TIMESCALE_DATABASE_URL is not set!")"""

content = content.replace(old, new)
with open('backend-service/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
