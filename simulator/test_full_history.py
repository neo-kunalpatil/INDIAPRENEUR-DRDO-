import psycopg2
import os
import time
from dotenv import load_dotenv
import urllib.request, json

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# Count before
cur.execute("SELECT COUNT(*) FROM mission_history")
before = cur.fetchone()[0]
print(f"Records before: {before}")

# Trigger TAKEOFF
urllib.request.urlopen(urllib.request.Request(
    'http://localhost:4000/api/mission',
    data=json.dumps({'phase': 'TAKEOFF', 'isActive': True, 'status': 'RUNNING'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
))
time.sleep(2)

# Trigger CRUISE (should save TAKEOFF history)
urllib.request.urlopen(urllib.request.Request(
    'http://localhost:4000/api/mission',
    data=json.dumps({'phase': 'CRUISE', 'isActive': True, 'status': 'RUNNING'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
))
time.sleep(2)

# Count after
cur.execute("SELECT COUNT(*) FROM mission_history")
after = cur.fetchone()[0]
print(f"Records after: {after}")

cur.execute("SELECT mission_phase, max_rpm, fuel_consumed FROM mission_history ORDER BY id DESC LIMIT 3")
for r in cur.fetchall():
    print(r)
    
conn.close()
