# chat/consumers.py
import json
import re
from datetime import datetime
from collections import defaultdict
import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async  # <-- important

log = logging.getLogger("chat")

ROOM_MEMBERS = defaultdict(set)

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        raw = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_name = re.sub(r"[^0-9A-Za-z_.-]", "-", raw)[:96]
        self.group_name = f"room_{self.room_name}"

        session = self.scope.get("session")
        log.info("WS connect: room=%s client=%s sessionid=%s",
                 self.room_name, self.scope.get("client"),
                 getattr(session, "session_key", None))

        if not session:
            log.warning("WS reject: no session")
            await self.close(code=4401); return

        allowed = (session.get("rooms") or {}).get(self.room_name)
        if not allowed:
            log.warning("WS reject: not in session.rooms %s", session.get("rooms"))
            await self.close(code=4403); return

        self.username = session.get("username") or "anon"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        log.info("WS accepted: room=%s user=%s", self.room_name, self.username)

        # send last messages (DB access wrapped)
        await self._send_history()

        ROOM_MEMBERS[self.room_name].add(self.username)
        await self._broadcast_presence()
        await self._broadcast_system("join")

    async def disconnect(self, code):
        try:
            if getattr(self, "username", None) in ROOM_MEMBERS.get(self.room_name, set()):
                ROOM_MEMBERS[self.room_name].discard(self.username)
                await self._broadcast_presence()
                await self._broadcast_system("leave")
        finally:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") != "chat.message":
            return
        text = (content.get("content") or "").strip()
        if not text:
            return

        # create message in DB (async-safe) and get iso timestamp
        created_iso = await self._db_create_message(self.room_name, self.username, text)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "username": self.username,
                "content": text,
                "created_at": created_iso,
            },
        )

    async def chat_message(self, event):
        await self.send_json({
            "type": "chat.message",
            "username": event["username"],
            "content": event["content"],
            "created_at": event["created_at"],
        })

    async def system_message(self, event):
        await self.send_json({
            "type": "system",
            "event": event["event"],
            "username": event["username"],
            "ts": event["ts"],
        })

    async def presence_state(self, event):
        await self.send_json({
            "type": "presence",
            "members": event["members"],
            "ts": event["ts"],
        })

    async def _send_history(self, limit: int = 50):
        items = await self._db_fetch_history(self.room_name, limit)  # async-safe
        await self.send_json({"type": "history", "items": items})

    async def _broadcast_system(self, evt: str):
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "system.message", "event": evt, "username": self.username, "ts": datetime.utcnow().isoformat() + "Z"},
        )

    async def _broadcast_presence(self):
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "presence.state",
                "members": sorted(list(ROOM_MEMBERS[self.room_name])),
                "ts": datetime.utcnow().isoformat() + "Z",
            },
        )

    # -------------------- DB helpers (run in threadpool) --------------------

    @database_sync_to_async
    def _db_fetch_history(self, room: str, limit: int):
        from .models import Message
        qs = Message.objects.filter(room=room).order_by("-created_at")[:limit]
        return [
            {
                "type": "chat.message",
                "username": m.username,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in reversed(list(qs))
        ]

    @database_sync_to_async
    def _db_create_message(self, room: str, username: str, content: str) -> str:
        from .models import Message
        m = Message.objects.create(room=room, username=username, content=content)
        return m.created_at.isoformat()
