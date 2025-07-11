from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from db.database import get_session
from models import Query, QueryBase, StatusEnum, RoleEnum, TriageLevelEnum
from agents.enhancer import enhance_query
from agents.scorer import calculate_safety_score
from agents.triage import determine_triage_level

router = APIRouter()


class QueryCreate(BaseModel):
    """
    Schema for creating a new query.
    """
    query_text: str
    user_id: Optional[int] = None


class QueryResponse(BaseModel):
    """
    Schema for query response.
    """
    query_id: str
    query_text: str
    enhanced_query: Optional[str] = None
    status: StatusEnum
    triage_level: Optional[TriageLevelEnum] = None
    safety_score: Optional[float] = None


async def verify_role(x_user_role: Optional[str] = Header(None)):
    """
    Verify the user role from the header.
    This is a simplified mock authentication for demo purposes.
    """
    if not x_user_role:
        x_user_role = RoleEnum.PATIENT.value  # Default to patient role
    
    try:
        return RoleEnum(x_user_role.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid role: {x_user_role}. Must be one of: {', '.join([r.value for r in RoleEnum])}"
        )


@router.post("/", response_model=QueryResponse, status_code=status.HTTP_201_CREATED)
async def create_query(
    query_data: QueryCreate,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Create a new medical query.
    This endpoint processes the query through multiple AI agents:
    1. Query Enhancement Agent
    2. Safety Scoring Agent
    3. Triage Agent
    """
    # Create a new query
    query = Query(**query_data.dict())
    
    # Process with AI agents
    query.enhanced_query = await enhance_query(query.query_text)
    query.safety_score = await calculate_safety_score(query.enhanced_query)
    query.triage_level = await determine_triage_level(query.enhanced_query, query.safety_score)
    
    # Update status based on triage level
    if query.triage_level == TriageLevelEnum.URGENT:
        query.status = StatusEnum.NEEDS_REVIEW
    elif query.safety_score and query.safety_score < 0.7:  # Safety threshold
        query.status = StatusEnum.NEEDS_REVIEW
    else:
        query.status = StatusEnum.PROCESSING
    
    # Save to database
    session.add(query)
    await session.commit()
    await session.refresh(query)
    
    return QueryResponse(
        query_id=query.query_id,
        query_text=query.query_text,
        enhanced_query=query.enhanced_query,
        status=query.status,
        triage_level=query.triage_level,
        safety_score=query.safety_score
    )


@router.get("/{query_id}", response_model=QueryResponse)
async def get_query(
    query_id: str,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Get a specific query by its ID.
    """
    # Query the database
    query = await session.exec(Query.select.where(Query.query_id == query_id))
    query = query.first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query with ID {query_id} not found"
        )
    
    return QueryResponse(
        query_id=query.query_id,
        query_text=query.query_text,
        enhanced_query=query.enhanced_query,
        status=query.status,
        triage_level=query.triage_level,
        safety_score=query.safety_score
    )


@router.get("/", response_model=List[QueryResponse])
async def list_queries(
    limit: int = 10,
    offset: int = 0,
    status: Optional[StatusEnum] = None,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    List queries with optional filtering by status.
    Doctors and admins can see all queries, patients can only see their own.
    """
    # Only doctors and admins can list all queries
    if role not in [RoleEnum.DOCTOR, RoleEnum.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can list all queries"
        )
    
    # Build the query
    query = Query.select()
    
    # Apply status filter if provided
    if status:
        query = query.where(Query.status == status)
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Execute the query
    results = await session.exec(query)
    queries = results.all()
    
    return [
        QueryResponse(
            query_id=q.query_id,
            query_text=q.query_text,
            enhanced_query=q.enhanced_query,
            status=q.status,
            triage_level=q.triage_level,
            safety_score=q.safety_score
        ) for q in queries
    ]
