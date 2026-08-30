import psycopg2
from app.config import settings

def get_main_db():
    """READ + WRITE Client Connection to Main Application PostgreSQL"""
    try:
        conn = psycopg2.connect(settings.MAIN_DATABASE_URL)
        return conn
    except Exception as e:
        print(f"[Main PostgreSQL Client Warning] Connection to MAIN_DATABASE_URL standby: {e}")
        return None

def release_main_db(conn):
    if not conn:
        return
    try:
        conn.close()
    except Exception:
        pass
