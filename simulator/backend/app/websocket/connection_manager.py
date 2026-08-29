import json
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, topic: str, payload: any):
        msg = json.dumps({"topic": topic, "type": topic, "payload": payload, "data": payload})
        for connection in self.active_connections:
            try:
                await connection.send_text(msg)
            except Exception:
                pass
