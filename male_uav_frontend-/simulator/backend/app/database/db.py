from app.database.connection import get_db_connection, release_db_connection

def init_db():
    conn = get_db_connection()
    if not conn:
        print("[TimescaleDB Connection Error] Unable to initialize schema — database connection failed.")
        return
    try:
        with conn.cursor() as cur:
            # 1. Enable TimescaleDB Extension if available
            try:
                cur.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
            except Exception as e:
                print(f"[Timescale Extension Warning] {e}")

            # 2. Engine Telemetry Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS engine_telemetry (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    rpm REAL,
                    torque_nm REAL,
                    power_kw REAL,
                    fuel_flow_lph REAL,
                    fuel_remaining_l REAL,
                    oil_temp_c REAL,
                    oil_pressure_kpa REAL,
                    egt_c REAL,
                    cht_c REAL,
                    battery_v REAL,
                    current_a REAL,
                    map_kpa REAL,
                    lambda REAL,
                    throttle_pct REAL,
                    load_pct REAL,
                    vib_x_g REAL,
                    vib_y_g REAL,
                    vib_z_g REAL,
                    health_score REAL,
                    mission_phase VARCHAR(50),
                    altitude_m REAL,
                    airspeed_kmh REAL,
                    vertical_speed_ms REAL
                );
            """)

            # 3. Environment Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS environment (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    mission_phase VARCHAR(50),
                    altitude REAL,
                    speed REAL,
                    temperature REAL,
                    humidity REAL,
                    pressure REAL
                );
            """)

            # 4. Mission Data Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS mission_data (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    mission_phase VARCHAR(50),
                    altitude REAL,
                    speed REAL,
                    temperature REAL,
                    humidity REAL,
                    pressure REAL
                );
            """)

            # 5. Engine Health Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS engine_health (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    score REAL,
                    rul REAL,
                    wear_level REAL
                );
            """)

            # 6. Fault Events Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS fault_events (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    fault_type VARCHAR(100),
                    active BOOLEAN,
                    severity VARCHAR(20),
                    description TEXT
                );
            """)

            # 7. AI Anomalies Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ai_anomalies (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    anomaly_score REAL,
                    anomaly_type VARCHAR(100),
                    severity VARCHAR(20),
                    confidence REAL
                );
            """)

            # 8. Mission Events Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS mission_events (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    event_type VARCHAR(100),
                    description TEXT
                );
            """)

            # 9. Alerts Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    alert_type VARCHAR(100),
                    message TEXT,
                    severity VARCHAR(20)
                );
            """)

            # 10. System Status Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS system_status (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    status VARCHAR(50),
                    version VARCHAR(20),
                    mode VARCHAR(50)
                );
            """)

            # 11. Predictions Table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    rul_hours REAL,
                    failure_probability REAL,
                    risk_score REAL
                );
            """)

            # Convert tables into TimescaleDB Hypertables
            hypertable_candidates = ['engine_telemetry', 'environment', 'mission_data', 'engine_health', 'ai_anomalies', 'predictions']
            for table in hypertable_candidates:
                try:
                    cur.execute(f"SELECT create_hypertable('{table}', 'time', if_not_exists => TRUE);")
                except Exception as e:
                    print(f"[Hypertable Info/Warning for {table}] {e}")

            # Create Indexes
            cur.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_time ON engine_telemetry(time DESC);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_mission_time ON mission_data(time DESC);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_health_time ON engine_health(time DESC);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_time ON ai_anomalies(time DESC);")

            conn.commit()
            print("[TimescaleDB Architecture] Database schemas & hypertables verified successfully.")
            
            # Startup Verification: Insert 1 test row, read back, then cleanup test row
            cur.execute("""
                INSERT INTO engine_telemetry (time, rpm, health_score, mission_phase)
                VALUES (NOW(), 1200.0, 100.0, 'STARTUP_TEST')
                RETURNING time, rpm, mission_phase;
            """)
            test_row = cur.fetchone()
            print(f"[Startup Verification SUCCESS] Inserted test row: time={test_row[0]}, rpm={test_row[1]}, phase='{test_row[2]}'")
            
            cur.execute("DELETE FROM engine_telemetry WHERE mission_phase = 'STARTUP_TEST';")
            conn.commit()
            print("[Startup Verification CLEANUP] Removed test row successfully.")

    except Exception as e:
        print(f"[TimescaleDB Init Error] Failed to initialize database tables: {e}")
    finally:
        release_db_connection(conn)
