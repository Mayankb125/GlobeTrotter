import asyncio
import json
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so we can import 'app'
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

# Load .env file
from dotenv import load_dotenv
load_dotenv(dotenv_path=backend_dir / ".env")

# Configure logging
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

from app.ai.planner import generate_itinerary


async def main():
    print("====================================================")
    print("RUNNING AI TRAVEL PLANNER (Phase 1 Manual Test)")
    print("====================================================\n")

    # Sample input parameters
    destination = "Goa"
    start_date = "2025-12-15"
    end_date = "2025-12-20"
    home_location = "Mumbai"
    budget_min = 10000.0
    budget_max = 35000.0
    travel_style = "balanced"
    interests = ["beaches", "food", "culture"]
    dietary_restrictions = []
    currency = "INR"

    print(f"Planning trip to {destination} for {home_location}...")
    print(f"Dates: {start_date} -> {end_date}")
    print(f"Budget: {budget_min} - {budget_max} {currency}\n")

    try:
        itinerary = await generate_itinerary(
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            home_location=home_location,
            budget_min=budget_min,
            budget_max=budget_max,
            travel_style=travel_style,
            interests=interests,
            dietary_restrictions=dietary_restrictions,
            currency=currency
        )

        print("\n====================================================")
        print("ITINERARY GENERATED SUCCESSFULLY")
        print("====================================================\n")
        print(json.dumps(itinerary, indent=2, ensure_ascii=False))

        # Save to examples directory
        output_dir = backend_dir / "examples"
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / "manual_itinerary.json"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(json.dumps(itinerary, indent=2, ensure_ascii=False))
        
        print(f"\nSaved result to: {output_file}")

    except Exception as e:
        print(f"\nError generating itinerary: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
