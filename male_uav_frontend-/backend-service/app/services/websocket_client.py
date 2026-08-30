import asyncio
import logging
import websockets
from app.config import settings
from app.websocket.connection_manager import dashboard_ws_manager

logger = logging.getLogger("SimulatorWebSocketClient")

class SimulatorWebSocketClient:
    def __init__(self):
        self.url = settings.SIMULATOR_WS
        self.running = False
        self.reconnect_interval = 2.0

    async def start(self):
        self.running = True
        while self.running:
            try:
                logger.info(f"Connecting to Simulator WebSocket at {self.url}...")
                async with websockets.connect(self.url) as ws:
                    logger.info("Successfully connected to Simulator WebSocket!")
                    while self.running:
                        message = await ws.recv()
                        # Broadcast directly to connected main dashboard clients
                        await dashboard_ws_manager.broadcast(message)
            except (websockets.ConnectionClosedError, websockets.ConnectionClosedOK) as exc:
                logger.warning(f"Simulator WebSocket closed: {exc}. Reconnecting in {self.reconnect_interval}s...")
            except Exception as exc:
                logger.error(f"Simulator WebSocket error: {exc}. Reconnecting in {self.reconnect_interval}s...")
            
            await asyncio.sleep(self.reconnect_interval)

    def stop(self):
        self.running = False

simulator_ws_client = SimulatorWebSocketClient()
