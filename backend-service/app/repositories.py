from app.database.telemetry_db import get_telemetry_db, release_telemetry_db
from typing import Dict, Any, List

class TelemetryRepository:
    def get_latest(self) -> Dict[str, Any]:
        """READ ONLY query for latest single telemetry row from TimescaleDB"""
        conn = get_telemetry_db()
        if not conn:
            return {}
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM engine_telemetry ORDER BY time DESC LIMIT 1;")
                desc = cur.description
                row = cur.fetchone()
                if not row or not desc:
                    return {}
                col_names = [d[0] for d in desc]
                data = dict(zip(col_names, row))
                if "time" in data and data["time"]:
                    data["timestamp"] = str(data["time"])
                return data
        except Exception as e:
            print(f"[TelemetryRepo Error] {e}")
            return {}
        finally:
            release_telemetry_db(conn)

    def get_history(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """READ ONLY history query from TimescaleDB engine_telemetry hypertable"""
        conn = get_telemetry_db()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM engine_telemetry ORDER BY time DESC LIMIT %s;", (limit,))
                desc = cur.description
                rows = cur.fetchall()
                if not rows or not desc:
                    return []
                col_names = [d[0] for d in desc]
                result = []
                for row in rows:
                    item = dict(zip(col_names, row))
                    if "time" in item and item["time"]:
                        item["timestamp"] = str(item["time"])
                    result.append(item)
                return result
        except Exception as e:
            print(f"[TelemetryRepo Error] {e}")
            return []
        finally:
            release_telemetry_db(conn)

    def get_vibration(self) -> Dict[str, Any]:
        """READ ONLY query for vibration metrics (x, y, z)"""
        latest = self.get_latest()
        return {
            "time": latest.get("timestamp"),
            "vib_x_g": latest.get("vib_x_g", 0.1),
            "vib_y_g": latest.get("vib_y_g", 0.1),
            "vib_z_g": latest.get("vib_z_g", 0.1)
        }

    def get_environment(self) -> Dict[str, Any]:
        """READ ONLY query for environmental telemetry from TimescaleDB"""
        conn = get_telemetry_db()
        if not conn:
            return {}
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM environment ORDER BY time DESC LIMIT 1;")
                desc = cur.description
                row = cur.fetchone()
                if not row or not desc:
                    latest = self.get_latest()
                    return {
                        "mission_phase": latest.get("mission_phase", "FLIGHT"),
                        "altitude": latest.get("altitude_m", 0),
                        "speed": latest.get("airspeed_kmh", 0)
                    }
                col_names = [d[0] for d in desc]
                data = dict(zip(col_names, row))
                if "time" in data and data["time"]:
                    data["timestamp"] = str(data["time"])
                return data
        except Exception as e:
            print(f"[TelemetryRepo Environment Error] {e}")
            return {}
        finally:
            release_telemetry_db(conn)

class HealthRepository:
    def get_latest_health(self) -> Dict[str, Any]:
        """READ ONLY query from TimescaleDB engine_health hypertable"""
        conn = get_telemetry_db()
        if not conn:
            return {"healthScore": 100.0, "rulHours": 1500.0, "status": "NOMINAL"}
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM engine_health ORDER BY time DESC LIMIT 1;")
                desc = cur.description
                row = cur.fetchone()
                if not row or not desc:
                    return {"healthScore": 100.0, "rulHours": 1500.0, "status": "NOMINAL"}
                col_names = [d[0] for d in desc]
                data = dict(zip(col_names, row))
                return {
                    "healthScore": data.get("score", 100.0),
                    "rulHours": data.get("rul", 1500.0),
                    "status": "NOMINAL" if data.get("score", 100.0) > 85.0 else "WARNING"
                }
        except Exception as e:
            print(f"[HealthRepo Error] {e}")
            return {"healthScore": 100.0, "rulHours": 1500.0, "status": "NOMINAL"}
        finally:
            release_telemetry_db(conn)

class FaultRepository:
    def get_latest_faults(self) -> List[Dict[str, Any]]:
        """READ ONLY query from TimescaleDB fault_events table"""
        conn = get_telemetry_db()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM fault_events ORDER BY time DESC LIMIT 20;")
                desc = cur.description
                rows = cur.fetchall()
                if not rows or not desc:
                    return []
                col_names = [d[0] for d in desc]
                result = []
                for row in rows:
                    item = dict(zip(col_names, row))
                    if "time" in item and item["time"]:
                        item["timestamp"] = str(item["time"])
                    result.append(item)
                return result
        except Exception as e:
            print(f"[FaultRepo Error] {e}")
            return []
        finally:
            release_telemetry_db(conn)

class AIAnomalyRepository:
    def get_latest_anomalies(self) -> List[Dict[str, Any]]:
        """READ ONLY query from TimescaleDB ai_anomalies hypertable"""
        conn = get_telemetry_db()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM ai_anomalies ORDER BY time DESC LIMIT 10;")
                desc = cur.description
                rows = cur.fetchall()
                if not rows or not desc:
                    return []
                col_names = [d[0] for d in desc]
                result = []
                for row in rows:
                    item = dict(zip(col_names, row))
                    if "time" in item and item["time"]:
                        item["timestamp"] = str(item["time"])
                    result.append(item)
                return result
        except Exception as e:
            print(f"[AIAnomalyRepo Error] {e}")
            return []
        finally:
            release_telemetry_db(conn)
