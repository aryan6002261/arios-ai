from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from arios_agent.agent import root_agent


app = FastAPI(title="ARIOS API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


session_service = InMemorySessionService()

runner = Runner(
    agent=root_agent,
    app_name="arios_agent",
    session_service=session_service,
)


@app.get("/")
def root():
    return {
        "status": "online",
        "agent": "ARIOS",
    }


@app.post("/chat")
async def chat(message: dict):

    user_message = message.get("message", "").strip()

    if not user_message:
        return {
            "response": "Please enter a message."
        }

    session = await session_service.create_session(
        app_name="arios_agent",
        user_id="user",
    )

    content = types.Content(
        role="user",
        parts=[
            types.Part(
                text=user_message
            )
        ],
    )

    final_response = ""

    async for event in runner.run_async(
        user_id="user",
        session_id=session.id,
        new_message=content,
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response = event.content.parts[0].text

    return {
        "response": final_response
    }
