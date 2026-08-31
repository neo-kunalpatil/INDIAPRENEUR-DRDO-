-- TimescaleDB & PostgreSQL Initialization Schema
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS engine_telemetry (
    time TIMESTAMPTZ NOT NULL,
    uav_id VARCHAR(64) NOT NULL,
    rpm INT NOT NULL,
    throttle_pct DOUBLE PRECISION NOT NULL,
    manifold_pressure_inhg DOUBLE PRECISION NOT NULL,
    fuel_flow_lh DOUBLE PRECISION NOT NULL,
    oil_pressure_bar DOUBLE PRECISION NOT NULL,
    oil_temp_c DOUBLE PRECISION NOT NULL,
    cht_c DOUBLE PRECISION[] NOT NULL,
    egt_c DOUBLE PRECISION[] NOT NULL,
    vibration_rms DOUBLE PRECISION NOT NULL
);
SELECT create_hypertable('engine_telemetry', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS mavlink_telemetry (
    time TIMESTAMPTZ NOT NULL,
    uav_id VARCHAR(64) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    altitude_ft DOUBLE PRECISION NOT NULL,
    heading_deg DOUBLE PRECISION NOT NULL,
    airspeed_kts DOUBLE PRECISION NOT NULL,
    groundspeed_kts DOUBLE PRECISION NOT NULL,
    battery_pct DOUBLE PRECISION NOT NULL,
    current_wp_index INT NOT NULL
);
SELECT create_hypertable('mavlink_telemetry', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS mission_state (
    time TIMESTAMPTZ NOT NULL,
    mission_id VARCHAR(64) NOT NULL,
    phase VARCHAR(64) NOT NULL,
    distance_remaining_km DOUBLE PRECISION NOT NULL
);
SELECT create_hypertable('mission_state', 'time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS risk_history (
    time TIMESTAMPTZ NOT NULL,
    mission_id VARCHAR(64) NOT NULL,
    dynamic_risk_score DOUBLE PRECISION NOT NULL,
    is_go BOOLEAN NOT NULL
);
SELECT create_hypertable('risk_history', 'time', if_not_exists => TRUE);
