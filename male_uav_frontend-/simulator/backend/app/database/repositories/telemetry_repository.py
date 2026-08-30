from app.database.connection import get_db_connection, release_db_connection
from typing import Dict, Any

class TelemetryRepository:
    def insert_telemetry(self, data: Dict[str, Any]):
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO engine_telemetry (
                        time, rpm, torque_nm, fuel_flow_lph, oil_temp_c, oil_pressure_kpa,
                        egt_c, cht_c, battery_v, current_a, map_kpa, lambda, throttle_pct,
                        load_pct, vib_x_g, vib_y_g, vib_z_g, health_score, mission_phase,
                        altitude_m, airspeed_kmh, vertical_speed_ms, fuel_remaining_l
                    )
                    VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    data.get("rpm", 0), data.get("torque_nm", data.get("torque", 0)),
                    data.get("fuelFlow", data.get("fuel_flow_lph", 0)), data.get("oilTemp", data.get("oil_temp_c", 0)),
                    data.get("oilPressure", data.get("oil_pressure_kpa", 0)), data.get("egt", data.get("egt_c", 0)),
                    data.get("cht", data.get("cht_c", 0)), data.get("batteryVoltage", data.get("battery_v", 0)),
                    data.get("current_a", 0), data.get("map", data.get("map_kpa", 0)), data.get("lambda", 1.0),
                    data.get("throttle", data.get("throttle_pct", 0)), data.get("load_pct", 0),
                    data.get("vib_x_g", 0), data.get("vib_y_g", 0), data.get("vibZ", data.get("vib_z_g", 0)),
                    data.get("health", 100), data.get("mission_phase", "FLIGHT"),
                    data.get("altitude", 0), data.get("airspeed", 0), data.get("verticalSpeed", 0),
                    data.get("fuelRemaining", 150)
                ))
                conn.commit()
        except Exception as e:
            print(f"[Telemetry Insert Error] {e}")
        finally:
            release_db_connection(conn)

    def get_history(self, limit: int = 1000):
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM engine_telemetry ORDER BY time DESC LIMIT %s", (limit,))
                colnames = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                return [dict(zip(colnames, r)) for r in rows]
        except Exception as e:
            print(f"[Telemetry History Fetch Error] {e}")
            return []
        finally:
            release_db_connection(conn)
