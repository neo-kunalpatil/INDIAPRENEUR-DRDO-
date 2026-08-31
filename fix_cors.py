import sys

with open('simulator/main.py', 'r', encoding='utf-8') as f:
    c = f.read()

old_cors = """app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)"""

new_cors = """app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://simulator-ashen.vercel.app",
        "https://indiapreneur-drdo-1.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_origin_regex="https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)"""

if old_cors in c:
    c = c.replace(old_cors, new_cors)
else:
    # Try more robust replacement
    import re
    c = re.sub(r'app\.add_middleware\(\s*CORSMiddleware,[\s\S]*?allow_headers=\["\*"\]\s*?,?\s*\)', new_cors, c)


with open('simulator/main.py', 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated simulator CORS")
