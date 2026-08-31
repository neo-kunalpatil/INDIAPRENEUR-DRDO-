import urllib.request, json, psycopg2

def fetch(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla'}))
        return json.loads(r.read())
    except Exception as e: return str(e)

res = {
  "main_health": fetch("http://127.0.0.1:8000/health"),
  "main_telemetry_latest": fetch("http://127.0.0.1:8000/api/telemetry/latest"),
  "sim_health": fetch("http://127.0.0.1:4000/health"),
  "sim_api_env": fetch("http://127.0.0.1:4000/api/environment")
}

tsdb = "postgres://tsdbadmin:zevphn0e675bs6lf@r027jcdwwk.tswdu18qwn.tsdb.cloud.timescale.com:39501/tsdb?sslmode=require"
try:
    c = psycopg2.connect(tsdb)
    cur = c.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    res['tables'] = [r[0] for r in cur.fetchall()]
    for t in ['engine_telemetry', 'mission_state', 'risk_history', 'mavlink_telemetry', 'engine_health', 'mission_events']:
        if t in res['tables']:
            cur.execute(f"SELECT count(*) FROM {t}")
            res[f'{t}_count'] = cur.fetchone()[0]
    c.close()
except Exception as e:
    res['tsdb_error'] = str(e)

with open("evidence.json", "w") as f:
    f.write(json.dumps(res, indent=2))
