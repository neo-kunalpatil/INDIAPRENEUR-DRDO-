import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("SELECT count(*) FROM engine_telemetry WHERE timestamp > NOW() - INTERVAL '10 seconds'")
print("RECENT INSERTS:", cur.fetchone()[0])
conn.close()
