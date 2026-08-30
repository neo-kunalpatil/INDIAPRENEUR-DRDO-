from app.database.connection import get_db_connection, release_db_connection

class HealthRepository:
    def insert_health(self, health_score: float, rul_hours: float, wear_level: float = 0.0):
        conn = get_db_connection()
        if not conn:
            return
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO engine_health (time, score, rul) VALUES (NOW(), %s, %s)
                """, (health_score, rul_hours))
                conn.commit()
        except Exception as e:
            print(f"[Health Insert Error] {e}")
        finally:
            release_db_connection(conn)
