import urllib.request, json, websockets, asyncio
async def test():
    try:
        r = urllib.request.urlopen("http://127.0.0.1:4000/api/environment")
        print("Env API:", r.read().decode())
    except Exception as e: print(e)

    try:
        r = urllib.request.urlopen("http://127.0.0.1:4000/api/telemetry/latest")
        print("Telemetry API:", r.read().decode())
    except Exception as e: print(e)

asyncio.run(test())
