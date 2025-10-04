import asyncio
from typing import Optional


class UserMessage:
    def __init__(self, text: str):
        self.text = text


class LlmChat:
    """A tiny local stub of the LLM chat interface used in the app.

    This stub is synchronous-friendly and provides `with_model` and
    `send_message` async method used by `app.py`. It simply echoes back
    the user's message for local testing.
    """

    def __init__(self, api_key: Optional[str] = None, session_id: str = "default", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.model = ("default", "")

    def with_model(self, provider: str, model_name: str):
        self.model = (provider, model_name)
        return self

    async def send_message(self, user_message: UserMessage) -> str:
        # Very small simulated latency
        await asyncio.sleep(0.01)
        # Echo input prefixed with a short confirmation to mimic an LLM reply
        return f"[stub reply] {user_message.text}"
