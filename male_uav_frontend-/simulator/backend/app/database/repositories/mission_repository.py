from app.database.connection import get_db_connection, release_db_connection
from typing import Dict, Any

class MissionRepository:
    def insert_mission_event(self, data: Dict[str, Any]):
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO mission_data (time, mission_phase, altitude, speed, temperature, humidity, pressure)
                    VALUES (NOW(), %s, %s, %s, %s, %s, %s)
                """, (
                    data.get("phase", data.get("mission_phase", "GROUND")),
                    data.get("altitude", 0), data.get("speed", 0),
                    data.get("oat", 15.0), data.get("humidity", 50.0), data.get("pressure", 101.3)
                ))
                conn.commit()
        except Exception as e:
            print(f"[Mission Insert Error] {e}")
        finally:
            release_db_connection(conn)
