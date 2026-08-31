import re

with open('backend-service/app/main.py', 'r', encoding='utf-8') as f:
    c = f.read()

new_cors = """app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://simulator-ashen.vercel.app",
        "https://indiapreneur-drdo-1.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)"""

c = re.sub(r'app\.add_middleware\(\s*CORSMiddleware,[\s\S]*?allow_headers=\["\*"\]\s*?,?\s*\)', new_cors, c)

with open('backend-service/app/main.py', 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated backend-service CORS")
