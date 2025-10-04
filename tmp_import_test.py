from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

async def t():
    print(await LlmChat().send_message(UserMessage('hello')))

asyncio.run(t())
