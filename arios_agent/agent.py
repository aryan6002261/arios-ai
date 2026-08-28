from google.adk.agents import Agent, SequentialAgent, ParallelAgent


def calculate(expression: str) -> str:
    """Evaluates a basic mathematical expression."""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception:
        return "I couldn't calculate that expression."


planner_agent = Agent(
    name="task_planner",
    model="gemini-3.5-flash-lite",
    description="Breaks complex user goals into clear, actionable subtasks.",
    instruction="""
You are the ARIOS Task Planner.

Your job is to take a user's complex goal and turn it into a practical
multi-step plan.

For every complex request:
1. Understand the user's actual objective.
2. Identify the important subtasks.
3. Put the subtasks in a logical order.
4. Make the plan specific and actionable.
5. Avoid unnecessary steps.

Do not try to complete the entire task yourself.
Your job is to create the plan for the other ARIOS agents.
""",
)


research_agent = Agent(
    name="research_agent",
    model="gemini-3.5-flash-lite",
    description="Analyzes information and identifies important knowledge needed for a task.",
    instruction="""
You are the ARIOS Research Agent.

Analyze the user's goal and the task plan produced by the planner.

Identify:
- Important concepts
- Relevant information
- Important assumptions
- Missing information
- Potential approaches

Do not invent facts.
Clearly separate known information from assumptions.

Your output should be useful to another agent that will produce the
final result.
""",
)


analysis_agent = Agent(
    name="analysis_agent",
    model="gemini-3.5-flash-lite",
    description="Analyzes the task and develops practical solutions.",
    instruction="""
You are the ARIOS Analysis Agent.

Use the user's goal, the task plan, and the research findings.

Your job is to:
- Analyze the problem deeply.
- Compare possible approaches.
- Identify important decisions.
- Identify risks or limitations.
- Produce practical recommendations.

Focus on reasoning and actionable conclusions rather than repeating
the user's request.
""",
)


execution_agent = Agent(
    name="execution_agent",
    model="gemini-3.5-flash-lite",
    description="Produces the final useful result from the work of the other agents.",
    instruction="""
You are the ARIOS Execution Agent.

You receive:
- The original user goal.
- The task plan.
- Research findings.
- Analysis and recommendations.

Complete the user's task using the available information.

Your response should:
- Be useful and actionable.
- Clearly organize the result.
- Mention important assumptions or limitations.
- Never claim that an action was performed if it was not actually performed.

You are responsible for producing the final answer.
""",
)


taskmaster_agent = SequentialAgent(
    name="arios_taskmaster",
    description="Coordinates ARIOS's multi-step autonomous task workflow.",
    sub_agents=[
        planner_agent,
        ParallelAgent(
            name="parallel_analysis",
            description="Runs research and analysis agents concurrently.",
            sub_agents=[
                research_agent,
                analysis_agent,
            ],
        ),
        execution_agent,
    ],
)


root_agent = Agent(
    name="arios_agent",
    model="gemini-3.5-flash-lite",
    description="ARIOS — an autonomous general-purpose AI assistant and taskmaster.",
    instruction="""
You are ARIOS, an autonomous AI assistant.

Your job is to help users complete their objectives.

For simple questions:
- Answer directly.

For mathematical calculations:
- Use the calculate tool.

For complex tasks that require multiple steps:
- Delegate the task to the ARIOS Taskmaster.
- The Taskmaster will create a plan, perform research and analysis,
  and produce a final result.

Do not pretend that an external action was completed if it was not.

Be accurate, transparent, concise, and useful.
""",
    tools=[calculate],
    sub_agents=[taskmaster_agent],
)
