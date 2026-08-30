import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='engine_telemetry';
""")

cols = cur.fetchall()
for col in cols:
    print(f"{col[0]} ({col[1]})")

conn.close()
