import time
import psycopg2
from psycopg2 import pool
from app.config import settings

_timescale_pool = None
_last_telemetry_fail_time = 0

def get_timescale_pool():
    global _timescale_pool, _last_telemetry_fail_time
    if _timescale_pool is None:
        now = time.time()
        if now - _last_telemetry_fail_time < 60:
            return None
        try:
            url = settings.TIMESCALE_DATABASE_URL
            if "connect_timeout" not in url:
                sep = "&" if "?" in url else "?"
                url = f"{url}{sep}connect_timeout=3"
            _timescale_pool = psycopg2.pool.SimpleConnectionPool(1, 10, url)
        except Exception as e:
            print(f"[Timescale Client DB Connection Warning] {e}")
            _last_telemetry_fail_time = now
            _timescale_pool = None
    return _timescale_pool

def get_telemetry_db():
    """READ ONLY connection client to TimescaleDB"""
    global _last_telemetry_fail_time
    now = time.time()
    if now - _last_telemetry_fail_time < 60:
        return None
    try:
        p = get_timescale_pool()
        if p:
            conn = p.getconn()
            if conn and conn.closed == 0:
                return conn
        return None
    except Exception as e:
        _last_telemetry_fail_time = time.time()
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
