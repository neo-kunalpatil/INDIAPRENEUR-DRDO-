import psycopg2
import os
import time
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
try:
    cur.execute("INSERT INTO mission_history (mission_phase, start_time, duration, fuel_consumed, max_egt, max_cht, max_rpm, min_health) VALUES (%s, to_timestamp(%s), %s, %s, %s, %s, %s, %s)", 
        ('TAKEOFF', time.time(), 10.0, 5.0, 100.0, 100.0, 5000.0, 100.0))
    conn.commit()
    print("Success")
except Exception as e:
    print(e)
conn.close()
