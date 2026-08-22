import pytest
from unittest.mock import AsyncMock, patch
from app.ai.planner import generate_itinerary
from app.ai.integrations.gemini_research import ResearchResult


@pytest.mark.asyncio
@patch("app.ai.planner.GeminiResearchClient")
@patch("app.ai.planner.GroqClient")
async def test_generate_itinerary_success(mock_groq_class, mock_gemini_class):
    # Setup mock Gemini Research
    mock_gemini_instance = mock_gemini_class.return_value
    mock_gemini_instance.research_destination = AsyncMock(return_value=ResearchResult(
        destination="Jaipur",
        weather_summary="Nice and sunny.",
        accommodation_suggestions="Heritage Stays",
        top_attractions="Palace, Fort",
        estimated_daily_cost=4000.0,
        currency="INR",
        travel_tips="Drink bottled water",
        best_time_to_visit="Winter"
    ))

    # Setup mock Groq Client
    mock_groq_instance = mock_groq_class.return_value.__aenter__.return_value
    mock_groq_instance.chat = AsyncMock(return_value="""
    {
        "destination": "Jaipur",
        "duration_days": 2,
        "accommodation": {
            "name": "Heritage Stay",
            "cost_per_night": 4000,
            "total_nights": 1,
            "total_cost": 4000,
            "recommendation": "Heritage hotel"
        },
        "daily_schedule": [
            {
                "day": 1,
                "date": "December 01, 2025",
                "activities": [
                    {
                        "time": "09:00 AM - 12:00 PM",
                        "name": "Amber Fort Tour",
                        "description": "Guided walking tour",
                        "location": "Amber Fort",
                        "cost": 500,
                        "transportation": "Taxi"
                    }
                ],
                "meals": [],
                "total_day_cost": 500
            }
        ],
        "transportation": {
            "to_destination": {"method": "Train", "cost": 1500, "duration": "4 hours"},
            "local": "Auto",
            "estimated_local_cost": 1000
        },
        "cost_breakdown": {
            "accommodation": 4000,
            "activities": 500,
            "food": 1000,
            "transportation": 2500,
            "miscellaneous": 1000,
            "total": 9000,
            "currency": "INR"
        },
        "special_notes": "Wear comfortable shoes."
    }
    """)

    # Call generate_itinerary
    result = await generate_itinerary(
        destination="Jaipur",
        start_date="2025-12-01",
        end_date="2025-12-03",
        home_location="Delhi",
        budget_min=5000,
        budget_max=15000,
        travel_style="balanced",
        interests=["culture"],
        dietary_restrictions=[],
        currency="INR"
    )

    # Assertions
    assert result["destination"] == "Jaipur"
    assert result["duration_days"] == 2
    assert result["cost_breakdown"]["total"] == 9000
    mock_gemini_instance.research_destination.assert_called_once()
    assert mock_groq_instance.chat.call_count == 1  # Fit within budget, no optimization trigger


@pytest.mark.asyncio
@patch("app.ai.planner.GeminiResearchClient")
@patch("app.ai.planner.GroqClient")
async def test_generate_itinerary_with_optimization(mock_groq_class, mock_gemini_class):
    # Setup mock Gemini Research
    mock_gemini_instance = mock_gemini_class.return_value
    mock_gemini_instance.research_destination = AsyncMock(return_value=ResearchResult(
        destination="Jaipur",
        weather_summary="Nice.",
        accommodation_suggestions="Stays",
        top_attractions="Fort",
        estimated_daily_cost=4000.0,
        currency="INR",
        travel_tips="Tips",
        best_time_to_visit="Winter"
    ))

    # Setup mock Groq Client
    mock_groq_instance = mock_groq_class.return_value.__aenter__.return_value
    # Draft is over budget (total = 18000, budget_max = 15000)
    draft_response = """
    {
        "destination": "Jaipur",
        "duration_days": 2,
        "cost_breakdown": {
            "total": 18000,
            "currency": "INR"
        }
    }
    """
    # Optimized response is within budget (total = 12000)
    opt_response = """
    {
        "destination": "Jaipur",
        "duration_days": 2,
        "cost_breakdown": {
            "total": 12000,
            "currency": "INR"
        },
        "optimization_applied": ["AI optimized"]
    }
    """
    mock_groq_instance.chat = AsyncMock(side_effect=[draft_response, opt_response])

    # Call generate_itinerary
    result = await generate_itinerary(
        destination="Jaipur",
        start_date="2025-12-01",
        end_date="2025-12-03",
        home_location="Delhi",
        budget_min=5000,
        budget_max=15000,
        travel_style="balanced",
        interests=["culture"],
        dietary_restrictions=[],
        currency="INR"
    )

    # Assertions
    assert result["destination"] == "Jaipur"
    assert result["cost_breakdown"]["total"] == 12000
    assert "AI optimized" in result["optimization_applied"]
    assert mock_groq_instance.chat.call_count == 2  # 1 draft generation + 1 budget optimization
