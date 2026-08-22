"""
Unified Entry Point for AI Travel Itinerary Planning.

Orchestrates the travel planning process by running:
1. Gemini Research - Fetches weather, recommendations, attractions.
2. Prompt Formatting - Generates custom traveler context.
3. Groq Drafting - Calls Llama 3.3 to construct the draft itinerary.
4. Groq Optimization - (Optional) Triggers budget optimization if the draft exceeds maximum budget.
"""

import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.ai.integrations.groq_client import GroqClient
from app.ai.integrations.gemini_research import GeminiResearchClient
from app.ai.prompts import build_planning_prompt, build_optimization_prompt

logger = logging.getLogger(__name__)


def parse_json_safely(text: str) -> dict:
    """
    Cleans markdown wrappers and parses JSON response.
    Supports robust fallback extraction for conversational wrappers.
    """
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: Extract the first JSON-like block starting with '{' and ending with '}'
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = cleaned[start_idx:end_idx + 1]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
        raise


async def generate_itinerary(
    destination: str,
    start_date: str,               # YYYY-MM-DD
    end_date: str,                 # YYYY-MM-DD
    home_location: str,
    budget_min: float,
    budget_max: float,
    travel_style: str = "balanced",
    interests: Optional[List[str]] = None,
    dietary_restrictions: Optional[List[str]] = None,
    currency: str = "INR"
) -> Dict[str, Any]:
    """
    Unified planning entrypoint. Performs Research -> Draft -> Optimize.
    Returns: Parsed itinerary dictionary matching the PRD specification.
    """
    logger.info(
        f"Planner initiated: {destination} ({start_date} to {end_date}) for {home_location}. "
        f"Budget style: {travel_style} ({budget_min}-{budget_max} {currency})"
    )

    # 1. Gather Destination Research (Gemini)
    logger.info("Executing research step via GeminiResearchClient...")
    gemini_client = GeminiResearchClient()
    try:
        research = await gemini_client.research_destination(
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            home_location=home_location,
            budget_range=(budget_min, budget_max),
            currency=currency
        )
        research_data = {
            "weather": research.weather_summary,
            "accommodation": research.accommodation_suggestions,
            "attractions": research.top_attractions,
            "estimated_daily_cost": research.estimated_daily_cost,
            "travel_tips": research.travel_tips,
            "best_time_to_visit": research.best_time_to_visit,
        }
    except Exception as e:
        logger.error(f"Gemini research step failed: {e}. Falling back to default values.")
        research_data = {
            "weather": "Weather summary unavailable.",
            "accommodation": "Accommodation suggestions unavailable.",
            "attractions": "Top attractions list unavailable.",
            "estimated_daily_cost": (budget_max / 10.0),
            "travel_tips": "Travel tips unavailable.",
            "best_time_to_visit": "Best time timing analysis unavailable.",
        }

    # 2. Build Planning Prompt
    prompt = build_planning_prompt(
        name="Traveler",
        home_location=home_location,
        budget_min=budget_min,
        budget_max=budget_max,
        travel_style=travel_style,
        interests=interests or ["sightseeing"],
        dietary_restrictions=dietary_restrictions or [],
        destination=destination,
        start_date=start_date,
        end_date=end_date,
        currency=currency,
        research_data=research_data
    )

    # 3. Generate Draft Itinerary (Groq)
    logger.info("Generating draft itinerary via GroqClient...")
    llm_response = None
    try:
        async with GroqClient() as groq:
            llm_response = await groq.chat(
                prompt=prompt,
                system_prompt="You are an expert travel planner. Generate detailed, realistic travel itineraries in JSON format only. Include accurate cost estimates, specific hotels, flights, and daily activities. Return ONLY valid JSON.",
                temperature=0.7,
                max_tokens=3000
            )
        itinerary = parse_json_safely(llm_response)
    except Exception as e:
        logger.error(f"Groq drafting failed or returned malformed JSON: {e}")
        if llm_response:
            logger.error(f"Raw LLM Response: {llm_response}")
        # Fallback basic template
        itinerary = {
            "destination": destination,
            "duration_days": 1,
            "accommodation": {
                "name": "Central Hotel",
                "cost_per_night": budget_min * 0.4,
                "total_nights": 1,
                "total_cost": budget_min * 0.4,
                "recommendation": "Affordable location close to main attractions."
            },
            "daily_schedule": [
                {
                    "day": 1,
                    "date": start_date,
                    "activities": [
                        {
                            "time": "09:00 AM - 12:00 PM",
                            "name": "City Walking Tour",
                            "description": "Guided tour of major landmarks.",
                            "location": destination,
                            "cost": 0,
                            "transportation": "Walking"
                        }
                    ],
                    "meals": [],
                    "total_day_cost": 0
                }
            ],
            "transportation": {
                "to_destination": {"method": "Bus", "cost": budget_min * 0.1, "duration": "Unknown"},
                "local": "Walking",
                "estimated_local_cost": 100
            },
            "cost_breakdown": {
                "accommodation": budget_min * 0.4,
                "activities": 0,
                "food": budget_min * 0.2,
                "transportation": budget_min * 0.1,
                "miscellaneous": budget_min * 0.1,
                "total": budget_min * 0.8,
                "currency": currency
            },
            "special_notes": "Itinerary created in fallback mode."
        }

    # 4. Check Budget and Apply Optimization if Over Budget
    total_cost = itinerary.get("cost_breakdown", {}).get("total", 0)
    logger.info(f"Draft itinerary cost generated: {total_cost} {currency} vs max budget {budget_max} {currency}")

    if total_cost > budget_max:
        logger.info("Draft total cost exceeds budget_max. Launching Groq optimizer...")
        try:
            opt_prompt = build_optimization_prompt(
                proposal_data={"itinerary": itinerary},
                budget_max=budget_max,
                currency=currency
            )
            async with GroqClient() as groq:
                opt_response = await groq.chat(
                    prompt=opt_prompt,
                    system_prompt="You are a budget optimization expert. Analyze travel itineraries and suggest cost-cutting measures while maintaining quality. Return JSON only.",
                    temperature=0.5,
                    max_tokens=2500
                )
            optimized_itinerary = parse_json_safely(opt_response)
            
            # Verify total cost in optimized version actually fits (or fallback to original if opt failed)
            opt_total = optimized_itinerary.get("cost_breakdown", {}).get("total", 0)
            if opt_total <= budget_max or opt_total < total_cost:
                logger.info(f"Optimization successful! New cost: {opt_total} {currency}")
                itinerary = optimized_itinerary
                if "optimization_applied" not in itinerary:
                    itinerary["optimization_applied"] = ["Cost-saving measures applied by AI optimizer"]
            else:
                logger.warning("Optimizer returned a cost still over budget or higher than draft. Using draft.")
        except Exception as e:
            logger.error(f"Optimization step failed: {e}. Using draft itinerary.")

    logger.info("Itinerary pipeline finished successfully.")
    return itinerary
