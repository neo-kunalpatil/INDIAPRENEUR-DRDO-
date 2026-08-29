import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger("ConnectionManager")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Dashboard client connected. Total active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Dashboard client disconnected. Remaining active clients: {len(self.active_connections)}")

    async def broadcast(self, data: str):
        if not self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(data)
            except Exception as e:
                logger.warning(f"Failed to send to client, marking for disconnect: {e}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

dashboard_ws_manager = ConnectionManager()
