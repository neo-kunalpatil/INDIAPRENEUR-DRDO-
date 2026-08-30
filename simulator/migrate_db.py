import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# 1. Inspect existing columns
cur.execute("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='engine_telemetry';
""")
existing_cols = {row[0] for row in cur.fetchall()}

# The desired schema from the user
desired_columns = {
    "timestamp": "TIMESTAMPTZ",
    "mission": "VARCHAR(50)",
    "rpm": "REAL",
    "throttle_pct": "REAL",
    "map_kpa": "REAL",
    "torque_nm": "REAL",
    "power_pct": "REAL",
    "fuel_flow_lph": "REAL",
    "fuel_remaining_l": "REAL",
    "egt_c": "REAL",
    "cht_c": "REAL",
    "oil_temp_c": "REAL",
    "oil_pressure_kpa": "REAL",
    "battery_voltage": "REAL",
    "alternator_voltage": "REAL",
    "altitude_m": "REAL",
    "airspeed_kmh": "REAL",
    "groundspeed_kmh": "REAL",
    "vertical_speed_ms": "REAL",
    "pitch_deg": "REAL",
    "roll_deg": "REAL",
    "yaw_deg": "REAL",
    "heading_deg": "REAL",
    "oat_c": "REAL",
    "humidity_pct": "REAL",
    "pressure_kpa": "REAL",
    "wind_speed_kmh": "REAL",
    "wind_direction_deg": "REAL",
    "density_altitude_m": "REAL",
    "health_score": "REAL",
    "active_faults": "TEXT",
    
    # Keeping these in case they're used elsewhere
    "lambda_ratio": "REAL",
    "vib_x_g": "REAL",
    "vib_y_g": "REAL",
    "vib_z_g": "REAL",
    "battery_a": "REAL",
    "time": "TIMESTAMPTZ"
}

# Rename conflicting columns if they exist
rename_map = {
    "oil_press_kpa": "oil_pressure_kpa",
    "battery_v": "battery_voltage"
}

for old_name, new_name in rename_map.items():
    if old_name in existing_cols and new_name not in existing_cols:
        print(f"Renaming {old_name} to {new_name}")
        cur.execute(f"ALTER TABLE engine_telemetry RENAME COLUMN {old_name} TO {new_name};")
        existing_cols.remove(old_name)
        existing_cols.add(new_name)

# If 'time' exists but 'timestamp' doesn't, we should ideally rename it or just add timestamp.
# Timescale might complain if we rename the time column, so we'll just add timestamp or duplicate it.
if "time" in existing_cols and "timestamp" not in existing_cols:
    print("Renaming time to timestamp (or we can just keep both and copy). Let's rename if possible.")
    try:
        cur.execute("ALTER TABLE engine_telemetry RENAME COLUMN time TO timestamp;")
        existing_cols.remove("time")
        existing_cols.add("timestamp")
    except Exception as e:
        print(f"Could not rename time to timestamp: {e}. Adding timestamp as separate column.")
        conn.rollback() # Rollback the failed rename
        cur.execute("ALTER TABLE engine_telemetry ADD COLUMN timestamp TIMESTAMPTZ;")
        existing_cols.add("timestamp")

# Add missing columns
missing_cols = []
for col, dtype in desired_columns.items():
    if col not in existing_cols:
        missing_cols.append(col)
        print(f"Adding column: {col} {dtype}")
        cur.execute(f"ALTER TABLE engine_telemetry ADD COLUMN IF NOT EXISTS {col} {dtype};")

conn.commit()

print("\n--- SCHEMA_STATUS ---")
cur.execute("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='engine_telemetry';
""")
for row in cur.fetchall():
    print(f"{row[0]}: {row[1]}")

print("\n--- MISSING_COLUMNS ---")
if missing_cols:
    print(missing_cols)
else:
    print("None")

print("\n--- MIGRATION_APPLIED ---")
print("SUCCESS")

conn.close()
