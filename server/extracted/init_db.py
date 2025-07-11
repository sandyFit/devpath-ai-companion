import logging
import asyncio
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import os
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Database URL - using in-memory SQLite for demo purposes
DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create async engine
async_engine = create_async_engine(DATABASE_URL, echo=True)

# Initialize database
async def init_db():
    """Initialize the database by creating all tables."""
    # Import models to ensure they are registered with SQLModel
    from models import User, Query, Response, File
    
    # Create tables using async engine
    logger.info("Creating database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database tables created successfully")
    
    # Check if we should seed the database with sample data
    if os.environ.get("SEED_DB", "false").lower() == "true":
        logger.info("Seeding database with sample data...")
        # Import and run the seed_db function
        from seed_db import seed_db
        await seed_db()
        logger.info("Database seeded successfully")

# Get an async database session
async def get_async_session():
    """Get an async database session."""
    async with AsyncSession(async_engine) as session:
        yield session

# For testing purposes
async def reset_db():
    """Reset the database by dropping and recreating all tables."""
    # Import models to ensure they are registered with SQLModel
    from models import User, Query, Response, File
    
    logger.info("Resetting database...")
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database reset successfully")

# Run the initialization if this script is executed directly
if __name__ == "__main__":
    asyncio.run(init_db())
