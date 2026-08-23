import asyncio
import uuid
from datetime import datetime, timezone

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


# --------------------------------------------------
# In-memory task storage
# --------------------------------------------------

tasks = {}


# --------------------------------------------------
# Helper: run ARIOS
# --------------------------------------------------

async def run_arios(user_message: str) -> str:

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

    return final_response


# --------------------------------------------------
# Background task worker
# --------------------------------------------------

async def execute_task(task_id: str, user_message: str):

    try:

        tasks[task_id]["status"] = "planning"
        tasks[task_id]["progress"] = 10

        await asyncio.sleep(0.5)

        tasks[task_id]["status"] = "working"
        tasks[task_id]["progress"] = 30

        result = await run_arios(user_message)

        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["result"] = result
        tasks[task_id]["completed_at"] = datetime.now(
            timezone.utc
        ).isoformat()

    except Exception as error:

        tasks[task_id]["status"] = "failed"
        tasks[task_id]["progress"] = 0
        tasks[task_id]["error"] = str(error)


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "status": "online",
        "agent": "ARIOS",
        "mode": "autonomous-taskmaster",
    }


# --------------------------------------------------
# Existing chat endpoint
# --------------------------------------------------

@app.post("/chat")
async def chat(message: dict):

    user_message = message.get("message", "").strip()

    if not user_message:

        return {
            "response": "Please enter a message."
        }

    final_response = await run_arios(user_message)

    return {
        "response": final_response
    }


# --------------------------------------------------
# Create autonomous task
# --------------------------------------------------

@app.post("/tasks")
async def create_task(message: dict):

    user_message = message.get("message", "").strip()

    if not user_message:

        return {
            "error": "Please enter a task."
        }

    task_id = str(uuid.uuid4())

    tasks[task_id] = {

        "task_id": task_id,

        "message": user_message,

        "status": "queued",

        "progress": 0,

        "result": None,

        "error": None,

        "created_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "completed_at": None,
    }

    asyncio.create_task(
        execute_task(
            task_id,
            user_message
        )
    )

    return {

        "task_id": task_id,

        "status": "queued",

        "message": "ARIOS has started working on your task."
    }


# --------------------------------------------------
# Get task status
# --------------------------------------------------

@app.get("/tasks/{task_id}")
async def get_task(task_id: str):

    task = tasks.get(task_id)

    if not task:

        return {
            "error": "Task not found."
        }

    return task
