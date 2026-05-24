from fastapi import WebSocket
from typing import List
import json
from app.core.logger import get_logger

logger = get_logger("connection_manager")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WS connection established | Active connection: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.warning(f"WS connection disconnected | Active connection: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            logger.warning(f"No active broadcast link available | message type: {message.get('type')}")
            return
        payload = json.dumps(message, ensure_ascii=False)
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)
        logger.debug(f"Broadcast completed | tip: {message.get('type')} | {len(self.active_connections)} client")

manager = ConnectionManager()