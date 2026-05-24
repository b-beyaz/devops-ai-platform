from collections import defaultdict

class ConversationStore:
    def __init__(self, max_history: int = 20):
        self.max_history = max_history
        self._store: dict[str, list[dict]] = defaultdict(list)

    def add_message(self, channel_id: str, role: str, content: str):
        self._store[channel_id].append({"role": role, "content": content})
        if len(self._store[channel_id]) > self.max_history:
            self._store[channel_id] = self._store[channel_id][-self.max_history:]

    def get_history(self, channel_id: str) -> list[dict]:
        return list(self._store[channel_id])

    def clear(self, channel_id: str):
        self._store[channel_id] = []

conversation_store = ConversationStore()