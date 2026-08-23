from google.adk.agents import Agent

def calculate(expression: str) -> str:
    """Evaluates a basic mathematical expression."""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception:
        return "I couldn't calculate that expression."


root_agent = Agent(
    name="arios_agent",
    model="gemini-3.5-flash",
    description="ARIOS — a general-purpose AI assistant.",
    instruction="""
You are ARIOS, a general-purpose AI assistant.

You can:
- Answer questions and explain concepts.
- Help with coding and problem solving.
- Perform calculations using the calculate tool.
- Break complex problems into clear steps.
- Ask for clarification when necessary.
- Be accurate, concise, and helpful.

Use the calculate tool whenever a mathematical calculation
would benefit from an exact result.

Never pretend to have information or capabilities you don't have.
""",
    tools=[calculate],
)
