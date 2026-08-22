import asyncio
from datetime import datetime

from src.agents.research_agent.agent import ResearchAgent
from src.models.itinerary import TaskContext, TravelerPreferences, TravelerProfile


async def main() -> None:
    ctx = TaskContext(
        task_id="demo-task",
        correlation_id="demo-corr",
        trace_id="demo-trace",
        traveler_profile=TravelerProfile(
            traveler_id="u1",
            name="Demo User",
            home_location="Delhi, IN",
            preferences=TravelerPreferences(budget_min=1000, budget_max=3000),
        ),
    )

    agent = ResearchAgent()
    result = await agent.run(
        context=ctx,
        destination="Jaipur",
        start_date=datetime(2025, 12, 1),
        end_date=datetime(2025, 12, 3),
        interests=["heritage", "food"],
        max_results=5,
    )

    # Pretty-print a subset of the results
    print("Destination:", result.get("destination"))
    print("Best time to visit:", result.get("best_time_to_visit"))
    print("Estimated daily cost:", result.get("estimated_daily_cost"), result.get("currency"))
    print("Top attractions (first 3):", result.get("top_attractions", [])[:3])
    print("Web results count:", len(result.get("web_results", [])))


if __name__ == "__main__":
    asyncio.run(main())
