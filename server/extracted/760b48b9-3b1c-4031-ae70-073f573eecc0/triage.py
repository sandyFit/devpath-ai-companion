from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from db.database import get_session
from models import Query, StatusEnum, RoleEnum, TriageLevelEnum

router = APIRouter()


class TriageUpdate(BaseModel):
    """
    Schema for updating triage level.
    """
    triage_level: TriageLevelEnum


class TriageResponse(BaseModel):
    """
    Schema for triage response.
    """
    query_id: str
    query_text: str
    triage_level: TriageLevelEnum
    status: StatusEnum


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


@router.get("/", response_model=List[TriageResponse])
async def list_triaged_queries(
    triage_level: Optional[TriageLevelEnum] = None,
    status: Optional[StatusEnum] = None,
    limit: int = 10,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    List queries with triage information.
    Can be filtered by triage level and status.
    Only doctors and admins can access this endpoint.
    """
    # Only doctors and admins can access triage information
    if role not in [RoleEnum.DOCTOR, RoleEnum.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can access triage information"
        )
    
    # Build the query
    query = Query.select().where(Query.triage_level != None)
    
    # Apply filters if provided
    if triage_level:
        query = query.where(Query.triage_level == triage_level)
    
    if status:
        query = query.where(Query.status == status)
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Execute the query
    results = await session.exec(query)
    queries = results.all()
    
    return [
        TriageResponse(
            query_id=q.query_id,
            query_text=q.query_text,
            triage_level=q.triage_level,
            status=q.status
        ) for q in queries
    ]


@router.put("/{query_id}", response_model=TriageResponse)
async def update_triage_level(
    query_id: str,
    triage_data: TriageUpdate,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Update the triage level for a specific query.
    Only doctors and admins can update triage levels.
    """
    # Only doctors and admins can update triage levels
    if role not in [RoleEnum.DOCTOR, RoleEnum.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can update triage levels"
        )
    
    # Get the query
    query_result = await session.exec(Query.select.where(Query.query_id == query_id))
    query = query_result.first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query with ID {query_id} not found"
        )
    
    # Update triage level
    query.triage_level = triage_data.triage_level
    
    # Update status based on new triage level
    if query.triage_level == TriageLevelEnum.URGENT:
        query.status = StatusEnum.NEEDS_REVIEW
    
    # Save changes
    session.add(query)
    await session.commit()
    await session.refresh(query)
    
    return TriageResponse(
        query_id=query.query_id,
        query_text=query.query_text,
        triage_level=query.triage_level,
        status=query.status
    )


@router.get("/urgent", response_model=List[TriageResponse])
async def list_urgent_queries(
    limit: int = 10,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    List all urgent queries that need immediate attention.
    Only doctors and admins can access this endpoint.
    """
    # Only doctors and admins can access urgent queries
    if role not in [RoleEnum.DOCTOR, RoleEnum.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can access urgent queries"
        )
    
    # Build the query for urgent cases
    query = Query.select().where(Query.triage_level == TriageLevelEnum.URGENT)
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Execute the query
    results = await session.exec(query)
    queries = results.all()
    
    return [
        TriageResponse(
            query_id=q.query_id,
            query_text=q.query_text,
            triage_level=q.triage_level,
            status=q.status
        ) for q in queries
    ]
