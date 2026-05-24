import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.connection_manager import manager
from app.core.conversation_store import conversation_store
from app.agents.agent_service import decide_responder, get_agent_response
from app.core.logger import get_logger

logger = get_logger("ws")
router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    client = websocket.client
    logger.info(f"New client connected: {client.host}:{client.port}")

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type")
            content: str = data.get("content", "").strip()
            channel_id: str = data.get("channelId", "general")

            logger.debug(f"Message received. | type: {msg_type} | channel: {channel_id} | content: {content[:50]}")

            if msg_type != "user_message" or not content:
                continue

            conversation_store.add_message(channel_id, "user", content)

            member = await decide_responder(
                user_message=content,
                active_channel=channel_id,
            )

            if not member:
                logger.warning(f"No member found to respond | Channel: {channel_id}")
                continue

            logger.info(f"The member who will respond has been selected: {member.name} ({member.role})")

            await manager.broadcast({
                "type": "typing",
                "senderId": member.id,
                "senderName": member.name,
                "channelId": channel_id,
            })
            await asyncio.sleep(1.5)

            logger.info(f"Sending a request to the Claude API | member: {member.name}")
            history = conversation_store.get_history(channel_id)

            try:
                response_text = await get_agent_response(
                    member=member,
                    conversation_history=history,
                )
                logger.info(f"Claude's reply was received | Member: {member.name} | length: {len(response_text)} karakter")
            except Exception as e:
                logger.error(f"Claude API error: {e}")
                await manager.broadcast({
                    "type": "agent_message",
                    "senderId": member.id,
                    "senderName": member.name,
                    "senderRole": member.role,
                    "avatarColor": member.avatar_color,
                    "textColor": member.text_color,
                    "content": "[AI could not generate a response, check API key]",
                    "channelId": channel_id,
                })
                continue

            conversation_store.add_message(channel_id, "assistant", response_text)

            await manager.broadcast({
                "type": "agent_message",
                "senderId": member.id,
                "senderName": member.name,
                "senderRole": member.role,
                "avatarColor": member.avatar_color,
                "textColor": member.text_color,
                "content": response_text,
                "channelId": channel_id,
            })

    except WebSocketDisconnect:
        logger.warning(f"Client disconnected: {client.host}:{client.port}")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket unexpected error: {e}")
        manager.disconnect(websocket)