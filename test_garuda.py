import urllib.request, json
req = urllib.request.Request("http://127.0.0.1:8000/api/garuda/analyze", data=b'{"telemetry":{"rpm":5000},"health":{"status":"OK"},"mission":{"state":"ACTIVE"}}', headers={'Content-Type': 'application/json'})
try:
    r = urllib.request.urlopen(req)
    print(r.read().decode())
except Exception as e:
    print(e)
