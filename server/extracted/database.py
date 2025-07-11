from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
import os
from typing import AsyncGenerator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment variables or fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

# Create async engine
async_engine = create_async_engine(DATABASE_URL, echo=False, future=True)

async def init_db():
    """
    Initialize the database by creating all tables.
    """
    # Import models to ensure they are registered with SQLModel
    from models import User, Query, Response, File
    
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting an async database session.
    """
    async with AsyncSession(async_engine) as session:
        yield session

def get_sync_engine():
    """
    Get a synchronous SQLite engine for operations that don't support async.
    """
    # Convert async URL to sync URL for synchronous operations
    sync_url = DATABASE_URL.replace("+aiosqlite", "")
    return create_engine(sync_url, echo=False)

def get_sync_session():
    """
    Get a synchronous database session.
    """
    engine = get_sync_engine()
    with Session(engine) as session:
        yield session
