import os
import psycopg2
from psycopg2 import pool
from app.config import settings

_pool = None

def get_connection_pool():
    global _pool
    if _pool is None:
        try:
            _pool = psycopg2.pool.SimpleConnectionPool(1, 20, settings.DATABASE_URL)
        except Exception as e:
            print(f"[Main Backend DB Connection Error] Pool init error: {e}")
            _pool = None
    return _pool

def get_db():
    try:
        p = get_connection_pool()
        if p:
            return p.getconn()
        return psycopg2.connect(settings.DATABASE_URL)
    except Exception as e:
        print(f"[Main Backend DB Connect Failure] {e}")
        return None

def release_db(conn):
    if not conn:
        return
    try:
        p = get_connection_pool()
        if p:
            p.putconn(conn)
        else:
            conn.close()
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
