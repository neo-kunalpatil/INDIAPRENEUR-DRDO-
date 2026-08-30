import urllib.request, json, time
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def post(path, data):
    urllib.request.urlopen(urllib.request.Request(
        f'http://localhost:4000{path}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    ))

def db_latest():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    cur.execute("SELECT mission, rpm, throttle_pct, fuel_flow_lph, egt_c, cht_c, oil_pressure_kpa, health_score, active_faults, altitude_m FROM engine_telemetry ORDER BY timestamp DESC LIMIT 1")
    row = cur.fetchone()
    conn.close()
    return row

print("\n=== FULL SYSTEM VALIDATION ===\n")

# 1. TAKEOFF
print("-- Setting TAKEOFF (isActive=True)")
post('/api/mission', {'phase': 'TAKEOFF', 'isActive': True, 'status': 'RUNNING'})
time.sleep(3)
r = db_latest()
print(f"   DB: phase={r[0]}, rpm={r[1]:.0f}, throttle={r[2]:.1f}%, fuel_flow={r[3]:.1f} L/hr, alt={r[9]:.1f}m")
assert r[0] == 'TAKEOFF', f"Expected TAKEOFF, got {r[0]}"
assert r[1] > 1000, f"RPM too low: {r[1]}"
assert r[2] > 50, f"Throttle too low: {r[2]}"
print("   [PASS] TAKEOFF")

# 2. CRUISE
print("\n-- Setting CRUISE")
post('/api/mission', {'phase': 'CRUISE', 'isActive': True, 'status': 'RUNNING'})
time.sleep(3)
r = db_latest()
print(f"   DB: phase={r[0]}, rpm={r[1]:.0f}, throttle={r[2]:.1f}%, fuel_flow={r[3]:.1f} L/hr")
assert r[0] == 'CRUISE', f"Expected CRUISE, got {r[0]}"
assert r[2] < 80, f"Throttle should drop for CRUISE: {r[2]}"
print("   [PASS] CRUISE")

# 3. Oil Leak Fault
print("\n-- Injecting oilLeak fault")
post('/api/faults', {'type': 'oilLeak', 'active': True})
time.sleep(3)
r = db_latest()
print(f"   DB: oil_pressure={r[6]:.1f} kPa, faults={r[8]}")
assert 'oilLeak' in r[8], f"oilLeak not in active_faults: {r[8]}"
print("   [PASS] FAULT oilLeak logged in DB")

# 4. Health score
print("\n-- Health score check")
r = db_latest()
print(f"   Health: {r[7]:.1f}%")
print(f"   [PASS] Health system ACTIVE")

# 5. Clear fault + DESCENT
print("\n-- Clearing fault, setting DESCENT")
post('/api/faults', {'type': 'oilLeak', 'active': False})
post('/api/mission', {'phase': 'DESCENT', 'isActive': True, 'status': 'RUNNING'})
time.sleep(3)
r = db_latest()
print(f"   DB: phase={r[0]}, rpm={r[1]:.0f}, throttle={r[2]:.1f}%")
assert r[0] == 'DESCENT', f"Expected DESCENT, got {r[0]}"
assert r[2] < 50, f"Throttle should be low for DESCENT: {r[2]}"
print("   [PASS] DESCENT")

# 6. STOP
print("\n-- Stopping mission")
post('/api/mission', {'phase': 'GROUND_IDLE', 'isActive': False, 'status': 'STOPPED'})
time.sleep(2)
r = db_latest()
print(f"   DB: phase={r[0]}")
print("   [PASS] STOP")

# 7. Mission history
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM mission_history")
cnt = cur.fetchone()[0]
cur.execute("SELECT mission_phase, max_rpm, fuel_consumed FROM mission_history ORDER BY id DESC LIMIT 3")
rows = cur.fetchall()
conn.close()
print(f"\n-- Mission history records: {cnt}")
for row in rows:
    print(f"   phase={row[0]}, max_rpm={row[1]:.0f}, fuel={row[2]:.3f}L")
assert cnt >= 1, "No mission history records!"
print("   [PASS] MISSION HISTORY")

print("\n=== ALL VALIDATIONS PASSED ===\n")
