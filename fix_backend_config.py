import re

with open('backend-service/app/config.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'os\.getenv\("SIMULATOR_API",\s*".*?"\)', 'os.getenv("SIMULATOR_API", "https://indiapreneur-drdo-1.onrender.com")', c)
c = re.sub(r'os\.getenv\("SIMULATOR_WS",\s*".*?"\)', 'os.getenv("SIMULATOR_WS", "wss://indiapreneur-drdo-1.onrender.com/stream")', c)
c = c.replace('postgresql://postgres:postgres@localhost:5432/main_dashboard_db', 'postgres://tsdbadmin:zevphn0e675bs6lf@r027jcdwwk.tswdu18qwn.tsdb.cloud.timescale.com:39501/tsdb?sslmode=require')

with open('backend-service/app/config.py', 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated config.py")
