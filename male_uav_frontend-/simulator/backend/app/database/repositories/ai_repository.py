from app.database.connection import get_db_connection, release_db_connection
from typing import Dict, Any

class AIRepository:
    def insert_anomaly(self, data: Dict[str, Any]):
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO ai_anomalies (time, anomaly_score, anomaly_type, severity, confidence)
                    VALUES (NOW(), %s, %s, %s, %s)
                """, (
                    data.get("anomalyScore", 0.0),
                    data.get("aiStatus", "NORMAL"),
                    data.get("severity", "GREEN"),
                    data.get("aiConfidence", 0.95)
                ))
                conn.commit()
        except Exception as e:
            print(f"[AI Anomaly Insert Error] {e}")
        finally:
            release_db_connection(conn)
