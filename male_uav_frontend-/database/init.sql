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
