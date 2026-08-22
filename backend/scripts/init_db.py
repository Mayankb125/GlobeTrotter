import asyncio
from pathlib import Path
import sys

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.core.database import Base, engine
from app.models.user import User
from app.models.city import City
from app.models.activity import Activity
from app.models.trip import Trip
from app.models.stop import Stop
from app.models.stop_activity import StopActivity
from app.models.budget_item import BudgetItem

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init())
