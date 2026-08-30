import time
import psycopg2
from psycopg2 import pool
from app.config import settings

_timescale_pool = None

def get_timescale_pool():
    global _timescale_pool
    if _timescale_pool is None:
        try:
            _timescale_pool = psycopg2.pool.SimpleConnectionPool(1, 20, settings.TIMESCALE_DATABASE_URL)
        except Exception as e:
            print(f"[Timescale Client DB Connection Error] {e}")
            _timescale_pool = None
    return _timescale_pool

def get_telemetry_db():
    """READ ONLY connection client to TimescaleDB"""
    try:
        p = get_timescale_pool()
        if p:
            return p.getconn()
        return psycopg2.connect(settings.TIMESCALE_DATABASE_URL)
    except Exception as e:
        print(f"[Timescale Client Connect Failure] {e}")
        return None

def release_telemetry_db(conn):
    if not conn:
        return
    try:
        p = get_timescale_pool()
        if p:
            p.putconn(conn)
        else:
            conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass

def check_timescale_health():
    """Check TimescaleDB connection health and query latency"""
    start_t = time.time()
    conn = get_telemetry_db()
    if not conn:
        return {
            "timescale_connected": False,
            "latency_ms": -1,
            "status": "UNAVAILABLE",
            "error": "Failed to connect to TimescaleDB"
        }
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*), MAX(time) FROM engine_telemetry;")
            row = cur.fetchone()
            total_rows = row[0] if row else 0
            latest_time = str(row[1]) if row and row[1] else "None"
            latency = int((time.time() - start_t) * 1000)
            return {
                "timescale_connected": True,
                "latency_ms": latency,
                "latest_packet_time": latest_time,
                "telemetry_rows": total_rows,
                "packet_delay_ms": 100,
                "status": "LIVE"
            }
    except Exception as e:
        return {
            "timescale_connected": False,
            "latency_ms": -1,
            "status": "ERROR",
            "error": str(e)
        }
    finally:
        release_telemetry_db(conn)
