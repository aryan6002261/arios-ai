import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from google.cloud import firestore

from arios_agent.agent import root_agent


app = FastAPI(title="ARIOS API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Google Firestore
# --------------------------------------------------

db = firestore.Client(
    project="arios-ai",
    database="arios-database"
)
tasks_collection = db.collection("tasks")


# --------------------------------------------------
# Google ADK
# --------------------------------------------------

session_service = InMemorySessionService()

runner = Runner(
    agent=root_agent,
    app_name="arios_agent",
    session_service=session_service,
)


# --------------------------------------------------
# Helper: update task
# --------------------------------------------------

def update_task(task_id: str, updates: dict):

    tasks_collection.document(task_id).set(
        updates,
        merge=True
    )

# --------------------------------------------------




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

        update_task(
            task_id,
            {
                "status": "planning",
                "progress": 10,
            }
        )

        await asyncio.sleep(0.5)

        update_task(
            task_id,
            {
                "status": "working",
                "progress": 30,
            }
        )

        result = await run_arios(user_message)

        update_task(
            task_id,
            {
                "status": "completed",
                "progress": 100,
                "result": result,
                "completed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }
        )

    except Exception as error:

        update_task(
            task_id,
            {
                "status": "failed",
                "progress": 0,
                "error": str(error),
            }
        )


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "status": "online",
        "agent": "ARIOS",
        "mode": "autonomous-taskmaster",
        "database": "firestore",
    }


# --------------------------------------------------
# Chat endpoint
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

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    task = {

        "task_id": task_id,

        "message": user_message,

        "status": "queued",

        "progress": 0,

        "result": None,

        "error": None,

        "created_at": created_at,

        "completed_at": None,
    }

    # Store in Google Firestore
    tasks_collection.document(task_id).set(task)

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

    # Get task from Firestore
    document = tasks_collection.document(task_id).get()

    if document.exists:
        return document.to_dict()

    return {
        "error": "Task not found."
    }
