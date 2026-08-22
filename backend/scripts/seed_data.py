import asyncio
import os
import sys
from decimal import Decimal
from pathlib import Path

# Add backend directory to sys.path so we can import 'app'
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy import select
from app.core.database import SessionLocal, engine
from app.models.city import City
from app.models.activity import Activity


async def seed():
    print("====================================================")
    print("🌱 SEEDING GLOBETROTTER CATALOG DATABASE 🌱")
    print("====================================================\n")

    # Define seed data
    cities_data = [
        {
            "name": "Goa",
            "country": "India",
            "region": "West Coast",
            "cost_index": 1.2,
            "popularity_score": 4.8,
            "image_url": "https://images.unsplash.com/photo-1512480681880-684175b5e54b",
            "activities": [
                {
                    "name": "Baga Beach Water Sports",
                    "description": "Parasailing, jet-skiing, and banana rides at Baga.",
                    "category": "adventure",
                    "cost_estimate": 2500.0,
                    "duration_minutes": 180,
                    "image_url": "https://images.unsplash.com/photo-1544735716-392fe2489ffa"
                },
                {
                    "name": "Old Goa Churches Historical Tour",
                    "description": "Guided walking tour through Basilica of Bom Jesus and Se Cathedral.",
                    "category": "sightseeing",
                    "cost_estimate": 500.0,
                    "duration_minutes": 120,
                    "image_url": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220"
                },
                {
                    "name": "Anjuna Flea Market Exploration",
                    "description": "Browse local handicrafts, jewelry, and enjoy street food at the beach flea market.",
                    "category": "leisure",
                    "cost_estimate": 200.0,
                    "duration_minutes": 150,
                    "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                }
            ]
        },
        {
            "name": "Jaipur",
            "country": "India",
            "region": "Rajasthan",
            "cost_index": 1.0,
            "popularity_score": 4.6,
            "image_url": "https://images.unsplash.com/photo-1477587458883-471a5ed94245",
            "activities": [
                {
                    "name": "Amber Fort Heritage Guided Tour",
                    "description": "Guided tour of the majestic amber fort and palaces.",
                    "category": "sightseeing",
                    "cost_estimate": 800.0,
                    "duration_minutes": 180,
                    "image_url": "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33"
                },
                {
                    "name": "Chokhi Dhani Ethnic Dinner Experience",
                    "description": "Traditional Rajasthani cultural dance show and a grand dinner feast.",
                    "category": "food",
                    "cost_estimate": 1200.0,
                    "duration_minutes": 240,
                    "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b"
                },
                {
                    "name": "Hawa Mahal & Old City Photo Walk",
                    "description": "Guided tour and photo walk through the palace of winds and local markets.",
                    "category": "sightseeing",
                    "cost_estimate": 300.0,
                    "duration_minutes": 90,
                    "image_url": "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944"
                }
            ]
        },
        {
            "name": "Mumbai",
            "country": "India",
            "region": "Maharashtra",
            "cost_index": 1.5,
            "popularity_score": 4.5,
            "image_url": "https://images.unsplash.com/photo-1566552881560-0be862a7c445",
            "activities": [
                {
                    "name": "Gateway of India & Colaba heritage walk",
                    "description": "Historical walking tour from the Gateway of India around Colaba's iconic buildings.",
                    "category": "sightseeing",
                    "cost_estimate": 0.00,
                    "duration_minutes": 120,
                    "image_url": "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7"
                },
                {
                    "name": "Marine Drive Sunset & Street Food",
                    "description": "Watch sunset over the Queen's necklace and try local Pav Bhaji at Chowpatty beach.",
                    "category": "food",
                    "cost_estimate": 400.0,
                    "duration_minutes": 150,
                    "image_url": "https://images.unsplash.com/photo-1498307818144-19047a83446a"
                },
                {
                    "name": "Sanjay Gandhi National Park & Kanheri Caves",
                    "description": "Explore ancient Buddhist caves carved out of basalt hills in a protected forest.",
                    "category": "adventure",
                    "cost_estimate": 600.0,
                    "duration_minutes": 240,
                    "image_url": "https://images.unsplash.com/photo-1562013989-11442b109e25"
                }
            ]
        }
    ]

    async with SessionLocal() as session:
        for c_data in cities_data:
            # Check if city already exists (idempotency check)
            result = await session.execute(
                select(City).where(City.name == c_data["name"])
            )
            city = result.scalar_one_or_none()

            if not city:
                city = City(
                    name=c_data["name"],
                    country=c_data["country"],
                    region=c_data["region"],
                    cost_index=Decimal(str(c_data["cost_index"])),
                    popularity_score=Decimal(str(c_data["popularity_score"])),
                    image_url=c_data["image_url"]
                )
                session.add(city)
                await session.flush()  # flushes to populate city.id for FK
                print(f"✅ Created City: {city.name}")
            else:
                print(f"ℹ️ City '{city.name}' already exists. Skipping city creation.")

            # Add activities for this city
            for act_data in c_data["activities"]:
                # Check if activity already exists
                act_result = await session.execute(
                    select(Activity).where(
                        (Activity.name == act_data["name"]) & (Activity.city_id == city.id)
                    )
                )
                activity = act_result.scalar_one_or_none()

                if not activity:
                    activity = Activity(
                        city_id=city.id,
                        name=act_data["name"],
                        description=act_data["description"],
                        category=act_data["category"],
                        cost_estimate=Decimal(str(act_data["cost_estimate"])),
                        duration_minutes=act_data["duration_minutes"],
                        image_url=act_data["image_url"]
                    )
                    session.add(activity)
                    print(f"  + Created Activity: {activity.name}")
                else:
                    print(f"  - Activity '{act_data['name']}' already exists. Skipping.")

        await session.commit()
        print("\n🎉 Database Seeding Completed Successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
