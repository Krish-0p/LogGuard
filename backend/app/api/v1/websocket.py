from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import logging

router = APIRouter()
logger = logging.getLogger("logguard.websocket")

class ConnectionManager:
    """Manages active WebSocket connections for real-time anomaly push."""
    
    def __init__(self):
        self._active: List[WebSocket] = []
    
    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._active.append(ws)
        logger.info(f"WS connected. Total connections: {len(self._active)}")
    
    def disconnect(self, ws: WebSocket):
        self._active.remove(ws)
        logger.info(f"WS disconnected. Total connections: {len(self._active)}")
    
    async def broadcast(self, data: dict):
        """Push anomaly event to ALL connected dashboard clients."""
        message = json.dumps(data)
        dead_connections = []
        
        for ws in self._active:
            try:
                await ws.send_text(message)
            except Exception:
                dead_connections.append(ws)
        
        for ws in dead_connections:
            self._active.remove(ws)

manager = ConnectionManager()

async def broadcast_anomaly(anomaly_data: dict):
    """Called by inference consumer when anomaly is detected."""
    await manager.broadcast({"type": "anomaly", "data": anomaly_data})

@router.websocket("/anomalies")
async def anomaly_websocket(ws: WebSocket):
    """
    WebSocket endpoint for real-time anomaly streaming.
    
    Connect: ws://api/ws/anomalies
    Messages: {type: "anomaly", data: {host, score, timestamp, ...}}
    """
    await manager.connect(ws)
    try:
        while True:
            # Keep connection alive, respond to pings
            msg = await ws.receive_text()
            if msg == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(ws)
