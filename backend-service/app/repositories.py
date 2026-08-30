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
                
                # Explicit rollback to keep connection pool clean in read-only mode
                conn.rollback()
                return data
        except Exception as e:
            print(f"[TelemetryRepo Error] {e}")
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
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
                conn.rollback()
                return result
        except Exception as e:
            print(f"[TelemetryRepo Error] {e}")
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
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
                conn.rollback()
                return data
        except Exception as e:
            print(f"[TelemetryRepo Environment Error] {e}")
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
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
                conn.rollback()
                return {
                    "healthScore": data.get("score", 100.0),
                    "rulHours": data.get("rul", 1500.0),
                    "status": "NOMINAL" if data.get("score", 100.0) > 85.0 else "WARNING"
                }
        except Exception as e:
            print(f"[HealthRepo Error] {e}")
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
            return {"healthScore": 100.0, "rulHours": 1500.0, "status": "NOMINAL"}
        finally:
            release_telemetry_db(conn)

class FaultRepository:
    def __init__(self):
        self._ensure_table()

    def _ensure_table(self):
        """Ensure fault_injections table exists in TimescaleDB"""
        conn = get_telemetry_db()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS fault_injections (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        uav_id TEXT NOT NULL,
                        engine_id TEXT NOT NULL,
                        fault_type TEXT NOT NULL,
                        severity TEXT NOT NULL,
                        status TEXT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW(),
                        removed_at TIMESTAMPTZ NULL,
                        created_by TEXT,
                        active BOOLEAN DEFAULT TRUE,
                        description TEXT,
                        mission_id TEXT
                    );
                """)
                conn.commit()
        except Exception as e:
            print(f"[FaultRepo Table Init Note] {e}")
            if conn:
                try: conn.rollback()
                except Exception: pass
        finally:
            release_telemetry_db(conn)

    def get_active_faults(self) -> List[Dict[str, Any]]:
        """Fetch all currently active injected faults from TimescaleDB"""
        conn = get_telemetry_db()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM fault_injections WHERE active = TRUE ORDER BY created_at DESC;")
                desc = cur.description
                rows = cur.fetchall()
                if not rows or not desc:
                    return []
                col_names = [d[0] for d in desc]
                result = []
                for row in rows:
                    item = dict(zip(col_names, row))
                    if "id" in item: item["id"] = str(item["id"])
                    if "created_at" in item and item["created_at"]: item["timestampInjected"] = str(item["created_at"])
                    result.append(item)
                conn.rollback()
                return result
        except Exception as e:
            print(f"[FaultRepo GetActive Error] {e}")
            if conn:
                try: conn.rollback()
                except Exception: pass
            return []
        finally:
            release_telemetry_db(conn)

    def inject_fault_db(self, uav_id: str, engine_id: str, fault_type: str, severity: str, created_by: str, description: str, mission_id: str) -> Dict[str, Any]:
        """Insert new injected fault into TimescaleDB"""
        conn = get_telemetry_db()
        if not conn:
            return {}
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO fault_injections (uav_id, engine_id, fault_type, severity, status, created_by, active, description, mission_id)
                    VALUES (%s, %s, %s, %s, 'ACTIVE', %s, TRUE, %s, %s)
                    RETURNING id, created_at;
                """, (uav_id, engine_id, fault_type, severity, created_by, description, mission_id))
                res = cur.fetchone()
                conn.commit()
                return {"id": str(res[0]), "created_at": str(res[1]), "active": True} if res else {}
        except Exception as e:
            print(f"[FaultRepo Inject Error] {e}")
            if conn:
                try: conn.rollback()
                except Exception: pass
            return {}
        finally:
            release_telemetry_db(conn)

    def remove_fault_db(self, fault_id: str):
        """Soft-remove fault in TimescaleDB by setting active=false and status='REMOVED'"""
        conn = get_telemetry_db()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE fault_injections
                    SET active = FALSE, status = 'REMOVED', removed_at = NOW(), updated_at = NOW()
                    WHERE id::text = %s OR fault_type = %s;
                """, (str(fault_id), str(fault_id)))
                conn.commit()
        except Exception as e:
            print(f"[FaultRepo Remove Error] {e}")
            if conn:
                try: conn.rollback()
                except Exception: pass
        finally:
            release_telemetry_db(conn)

    def get_fault_history(self) -> List[Dict[str, Any]]:
        """Fetch historical audit trail of all injected & removed faults"""
        conn = get_telemetry_db()
        if not conn:
            return []
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT *, (COALESCE(removed_at, NOW()) - created_at) as duration_active FROM fault_injections ORDER BY created_at DESC LIMIT 100;")
                desc = cur.description
                rows = cur.fetchall()
                if not rows or not desc:
                    return []
                col_names = [d[0] for d in desc]
                result = []
                for row in rows:
                    item = dict(zip(col_names, row))
                    if "id" in item: item["id"] = str(item["id"])
                    if "created_at" in item and item["created_at"]: item["created_at"] = str(item["created_at"])
                    if "removed_at" in item and item["removed_at"]: item["removed_at"] = str(item["removed_at"])
                    if "duration_active" in item and item["duration_active"]: item["duration_active"] = str(item["duration_active"])
                    result.append(item)
                conn.rollback()
                return result
        except Exception as e:
            print(f"[FaultRepo History Error] {e}")
            if conn:
                try: conn.rollback()
                except Exception: pass
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
                conn.rollback()
                return result
        except Exception as e:
            print(f"[AIAnomalyRepo Error] {e}")
            if conn:
                try:
                    conn.rollback()
                except Exception:
                    pass
            return []
        finally:
            release_telemetry_db(conn)
