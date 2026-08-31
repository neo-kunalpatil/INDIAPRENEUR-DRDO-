import re
with open('backend-service/app/services/websocket_client.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = """        self.url = settings.SIMULATOR_WS"""
new = """        self.url = settings.SIMULATOR_WS
        if not self.url:
            logger.error("SIMULATOR_WS environment variable is not set!")"""

content = content.replace(old, new)

old2 = """                logger.info(f"Connecting to Simulator WebSocket at {self.url}...")
                async with websockets.connect(self.url) as ws:"""
new2 = """                if not self.url:
                    logger.error("Cannot connect: SIMULATOR_WS is not configured.")
                    await asyncio.sleep(self.reconnect_interval)
                    continue

                logger.info(f"Connecting to Simulator WebSocket at {self.url}...")
                async with websockets.connect(self.url) as ws:"""

content = content.replace(old2, new2)

with open('backend-service/app/services/websocket_client.py', 'w', encoding='utf-8') as f:
    f.write(content)
