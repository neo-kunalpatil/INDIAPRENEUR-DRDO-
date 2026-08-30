from app.database.connection import get_db_connection, release_db_connection
from typing import Dict, Any

class FaultRepository:
    def insert_fault_event(self, data: Dict[str, Any]):
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO fault_events (time, fault_type, active, severity, description)
                    VALUES (NOW(), %s, %s, %s, %s)
                """, (
                    data.get("type", "FAULT"),
                    data.get("active", True),
                    data.get("severity", "MEDIUM"),
                    f"Fault active={data.get('active', True)}, severity={data.get('severity', 'MEDIUM')}"
                ))
                cur.execute("""
                    INSERT INTO mission_events (time, event_type, description)
                    VALUES (NOW(), %s, %s)
                """, (
                    data.get("type", "FAULT"),
                    f"Fault active={data.get('active', True)}, severity={data.get('severity', 'MEDIUM')}"
                ))
                conn.commit()
        except Exception as e:
            print(f"[Fault Insert Error] {e}")
        finally:
            release_db_connection(conn)
