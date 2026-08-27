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


# ============================================================
# APP
# ============================================================

app = FastAPI(title="ARIOS API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FIRESTORE
# ============================================================
# Firestore is optional.
#
# Cloud Shell / Google Cloud:
#   Firestore works automatically through ADC.
#
# Render:
#   If Google credentials are unavailable, ARIOS continues
#   using in-memory task storage instead of crashing.
# ============================================================

db = None
tasks_collection = None
FIRESTORE_ENABLED = False

try:
    db = firestore.Client(
        project="arios-ai",
        database="arios-database",
    )

    tasks_collection = db.collection("tasks")
    FIRESTORE_ENABLED = True

    print("✓ Firestore connected")

except Exception as error:
    FIRESTORE_ENABLED = False

    print("⚠ Firestore unavailable.")
    print(f"⚠ Reason: {error}")
    print("⚠ Continuing with in-memory task storage.")


# ============================================================
# GOOGLE ADK
# ============================================================

session_service = InMemorySessionService()

runner = Runner(
    agent=root_agent,
    app_name="arios_agent",
    session_service=session_service,
)


# ============================================================
# IN-MEMORY TASK STORAGE
# ============================================================

tasks = {}


# ============================================================
# HELPER: UPDATE TASK
# ============================================================

def update_task(task_id: str, updates: dict):

    # Always update local memory
    if task_id in tasks:
        tasks[task_id].update(updates)

    # Update Firestore only when available
    if FIRESTORE_ENABLED and tasks_collection is not None:

        try:
            tasks_collection.document(task_id).set(
                updates,
                merge=True,
            )

        except Exception as error:
            print(f"⚠ Firestore update failed: {error}")


# ============================================================
# HELPER: RUN ARIOS
# ============================================================

async def run_arios(user_message: str) -> str:

    session = await session_service.create_session(
        app_name="arios_agent",
        user_id="user",
    )

    content = types.Content(
        role="user",
        parts=[
            types.Part(
                text=user_message,
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


# ============================================================
# BACKGROUND TASK WORKER
# ============================================================

async def execute_task(
    task_id: str,
    user_message: str,
):

    try:

        # ------------------------------
        # Planning
        # ------------------------------

        update_task(
            task_id,
            {
                "status": "planning",
                "progress": 10,
            },
        )

        await asyncio.sleep(0.5)

        # ------------------------------
        # Working
        # ------------------------------

        update_task(
            task_id,
            {
                "status": "working",
                "progress": 30,
            },
        )

        # ------------------------------
        # Run ARIOS
        # ------------------------------

        result = await run_arios(user_message)

        # ------------------------------
        # Completed
        # ------------------------------

        update_task(
            task_id,
            {
                "status": "completed",
                "progress": 100,
                "result": result,
                "completed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            },
        )

    except Exception as error:

        print(f"❌ Task {task_id} failed: {error}")

        update_task(
            task_id,
            {
                "status": "failed",
                "progress": 0,
                "error": str(error),
            },
        )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "agent": "ARIOS",
        "mode": "autonomous-taskmaster",
        "database": (
            "firestore"
            if FIRESTORE_ENABLED
            else "in-memory"
        ),
    }


# ============================================================
# CHAT ENDPOINT
# ============================================================

@app.post("/chat")
async def chat(message: dict):

    user_message = message.get(
        "message",
        "",
    ).strip()

    if not user_message:

        return {
            "response": "Please enter a message.",
        }

    final_response = await run_arios(
        user_message,
    )

    return {
        "response": final_response,
    }


# ============================================================
# CREATE AUTONOMOUS TASK
# ============================================================

@app.post("/tasks")
async def create_task(message: dict):

    user_message = message.get(
        "message",
        "",
    ).strip()

    if not user_message:

        return {
            "error": "Please enter a task.",
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

    # Always store locally
    tasks[task_id] = task

    # Store in Firestore when available
    if FIRESTORE_ENABLED and tasks_collection is not None:

        try:

            tasks_collection.document(
                task_id
            ).set(task)

        except Exception as error:

            print(
                f"⚠ Firestore task creation failed: {error}"
            )

    # Start autonomous task
    asyncio.create_task(
        execute_task(
            task_id,
            user_message,
        )
    )

    return {
        "task_id": task_id,
        "status": "queued",
        "message": (
            "ARIOS has started working "
            "on your task."
        ),
    }


# ============================================================
# GET TASK STATUS
# ============================================================

@app.get("/tasks/{task_id}")
async def get_task(task_id: str):

    # ------------------------------
    # Local memory first
    # ------------------------------

    task = tasks.get(task_id)

    if task:
        return task

    # ------------------------------
    # Firestore fallback
    # ------------------------------

    if FIRESTORE_ENABLED and tasks_collection is not None:

        try:

            document = (
                tasks_collection
                .document(task_id)
                .get()
            )

            if document.exists:
                return document.to_dict()

        except Exception as error:

            print(
                f"⚠ Firestore read failed: {error}"
            )

    # ------------------------------
    # Not found
    # ------------------------------

    return {
        "error": "Task not found.",
    }
