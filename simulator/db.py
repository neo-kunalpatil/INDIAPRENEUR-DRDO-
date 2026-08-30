import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/aero_sim")

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"DB Connection Warning: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if not conn:
        print("DB Connection bypassed (Offline/Dry Run Mode)")
        return
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS mission_history (id SERIAL PRIMARY KEY, mission_phase VARCHAR(50), start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(), end_time TIMESTAMPTZ, duration REAL, fuel_consumed REAL, max_egt REAL, max_cht REAL, max_rpm REAL, min_health REAL);
                CREATE TABLE IF NOT EXISTS engine_telemetry (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    rpm REAL, oil_temp_c REAL, oil_press_kpa REAL, cht_c REAL, egt_c REAL,
                    fuel_flow_lph REAL, fuel_remaining_l REAL, throttle_pct REAL, map_kpa REAL, lambda_ratio REAL,
                    battery_v REAL, alternator_v REAL, current_a REAL,
                    vib_x_g REAL, vib_y_g REAL, vib_z_g REAL,
                    load_pct REAL, torque_nm REAL, power_kw REAL,
                    combustion_eff REAL, misfire_count INTEGER, health_score REAL,
                    thermal_stress REAL, wear_index REAL, failure_prob REAL, rul_hours REAL,
                    altitude_m REAL, airspeed_mps REAL, ground_speed_mps REAL, vertical_speed_mps REAL,
                    pitch_deg REAL, roll_deg REAL, yaw_deg REAL, heading_deg REAL,
                    wind_speed_mps REAL, wind_direction_deg REAL, oat_c REAL,
                    humidity_pct REAL, pressure_kpa REAL, density_altitude_m REAL, mission_phase VARCHAR(50)
                );
                
                -- Convert to hypertable if it isn't already
                SELECT create_hypertable('engine_telemetry', 'time', if_not_exists => TRUE);
                
                -- Add a retention policy (e.g. keep for 30 days)
                SELECT add_retention_policy('engine_telemetry', INTERVAL '30 days', if_not_exists => TRUE);
                
                CREATE TABLE IF NOT EXISTS mission_data (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    mission_phase VARCHAR(50), altitude REAL, speed REAL, temperature REAL, humidity REAL, pressure REAL
                );
                CREATE TABLE IF NOT EXISTS engine_health (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    score REAL, rul REAL
                );
                CREATE TABLE IF NOT EXISTS ai_prediction (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    status VARCHAR(50), confidence REAL, recommendation TEXT
                );
                CREATE TABLE IF NOT EXISTS mission_events (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    event_type VARCHAR(100), description TEXT
                );
                CREATE TABLE IF NOT EXISTS ai_anomalies (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    anomaly_score REAL, anomaly_type VARCHAR(50), severity VARCHAR(20), confidence REAL
                );
                CREATE TABLE IF NOT EXISTS ai_predictions (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    predicted_failure VARCHAR(100), probability REAL, confidence REAL, prediction_horizon VARCHAR(50)
                );
                CREATE TABLE IF NOT EXISTS ai_recommendations (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    recommendation TEXT, priority VARCHAR(20), reason TEXT
                );
                CREATE TABLE IF NOT EXISTS rul_predictions (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    rul_hours REAL, rul_cycles REAL, confidence REAL, predicted_failure VARCHAR(100), failure_probability REAL
                );
                CREATE TABLE IF NOT EXISTS component_degradation (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    oil_deg REAL, fuel_deg REAL, thermal_deg REAL, electrical_deg REAL, vibration_deg REAL, sensor_deg REAL, turbo_deg REAL, battery_deg REAL
                );
                CREATE TABLE IF NOT EXISTS mission_risk (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    mission_phase VARCHAR(50), risk_score REAL, risk_level VARCHAR(20), failure_probability REAL
                );
                CREATE TABLE IF NOT EXISTS reliability_metrics (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    reliability_score REAL, availability_score REAL, mission_success_probability REAL
                );
            """)
            conn.commit()
            print("Database schema strictly verified.")
    except Exception as err:
        print("DB Init Error:", err)
    finally:
        conn.close()
