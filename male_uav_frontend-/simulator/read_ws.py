import asyncio
import websockets

async def run():
    async with websockets.connect('ws://localhost:4000/stream') as ws:
        msg = await ws.recv()
        print(msg)

asyncio.run(run())
