import os
import time
import urllib.parse
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

# Absolute path targeting strictly simulator/backend/.env
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

if not os.path.exists(ENV_PATH):
    raise FileNotFoundError(f"CRITICAL CONFIGURATION ERROR: Backend environment file missing at absolute path: {ENV_PATH}")

load_dotenv(dotenv_path=ENV_PATH, override=True)

TIMESCALE_DATABASE_URL = os.getenv("TIMESCALE_DATABASE_URL") or os.getenv("DATABASE_URL")
if not TIMESCALE_DATABASE_URL:
    raise ValueError(f"CRITICAL CONFIGURATION ERROR: TIMESCALE_DATABASE_URL environment variable is missing in {ENV_PATH}!")

# STRICT CHECK: Raise exception immediately if localhost or 127.0.0.1 is found
if "localhost" in TIMESCALE_DATABASE_URL.lower() or "127.0.0.1" in TIMESCALE_DATABASE_URL:
    raise ValueError(f"CRITICAL INTEGRATION ERROR: Localhost database URL detected in {ENV_PATH}! Backend is strictly configured to connect to Timescale Cloud.")

# Mask password safely for logging
try:
    parsed = urllib.parse.urlparse(TIMESCALE_DATABASE_URL)
    masked_netloc = parsed.netloc
    if parsed.password:
        masked_netloc = parsed.netloc.replace(parsed.password, "******")
    SAFE_DB_URL = urllib.parse.urlunparse((parsed.scheme, masked_netloc, parsed.path, parsed.params, parsed.query, parsed.fragment))
    CONNECTED_HOST = parsed.hostname or "r027jcdwwk.tswdu18qwn.tsdb.cloud.timescale.com"
except Exception:
    SAFE_DB_URL = "postgres://tsdbadmin:******@r027jcdwwk.tswdu18qwn.tsdb.cloud.timescale.com"
    CONNECTED_HOST = "r027jcdwwk.tswdu18qwn.tsdb.cloud.timescale.com"

print(f"[Timescale Cloud Integration] Loaded backend environment strictly from: {ENV_PATH}")
print(f"[Timescale Cloud Integration] Connecting strictly to TIMESCALE_DATABASE_URL: {SAFE_DB_URL}")

_connection_pool = None
_last_failed_connect_time = 0

def get_connection_pool():
    global _connection_pool, _last_failed_connect_time
    # Circuit breaker: Don't retry failed connection pool init more than once every 60s
    if _connection_pool is None:
        now = time.time()
        if now - _last_failed_connect_time < 60:
            return None
        try:
            url = TIMESCALE_DATABASE_URL
            if "connect_timeout" not in url:
                sep = "&" if "?" in url else "?"
                url = f"{url}{sep}connect_timeout=3"
            _connection_pool = psycopg2.pool.SimpleConnectionPool(1, 10, url)
        except Exception as e:
            print(f"[Timescale Connection Warning] Remote Cloud DB unreachable (offline mode active): {e}")
            _last_failed_connect_time = now
            _connection_pool = None
    return _connection_pool

def get_db_connection():
    global _last_failed_connect_time
    now = time.time()
    if now - _last_failed_connect_time < 60:
        return None

    try:
        pool_inst = get_connection_pool()
        if pool_inst:
            conn = pool_inst.getconn()
            if conn and conn.closed != 0:
                try:
                    pool_inst.putconn(conn, close=True)
                except Exception:
                    pass
                conn = None
            if conn:
                return conn
        return None
    except Exception as e:
        _last_failed_connect_time = time.time()
        print(f"[Timescale DB Connection Failure] {e}")
        return None

def release_db_connection(conn):
    if not conn:
        return
    try:
        if conn.closed != 0:
            return
        pool_inst = get_connection_pool()
        if pool_inst:
            pool_inst.putconn(conn)
        else:
            conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
