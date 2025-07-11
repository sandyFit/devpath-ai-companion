from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from db.database import get_session
from models import Query, Response, StatusEnum, RoleEnum
from agents.responder import generate_response

router = APIRouter()


class ReviewCreate(BaseModel):
    """
    Schema for creating a response for review.
    """
    query_id: str


class ReviewUpdate(BaseModel):
    """
    Schema for updating a review.
    """
    is_approved: bool
    doctor_notes: Optional[str] = None


class ReviewResponse(BaseModel):
    """
    Schema for review response.
    """
    id: int
    query_id: str
    query_text: str
    response_text: str
    is_approved: bool
    doctor_notes: Optional[str] = None
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


@router.post("/generate", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_response_for_review(
    review_data: ReviewCreate,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Generate an AI response for a query and submit it for doctor review.
    """
    # Get the query
    query_result = await session.exec(Query.select.where(Query.query_id == review_data.query_id))
    query = query_result.first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query with ID {review_data.query_id} not found"
        )
    
    # Check if query is in a valid state for response generation
    if query.status not in [StatusEnum.PROCESSING, StatusEnum.NEEDS_REVIEW]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query with status {query.status} cannot be processed for review"
        )
    
    # Generate AI response
    response_text = await generate_response(query.enhanced_query or query.query_text)
    
    # Create response record
    response = Response(
        response_text=response_text,
        is_approved=False,  # Requires doctor approval
        query_id=query.id
    )
    
    # Update query status
    query.status = StatusEnum.NEEDS_REVIEW
    
    # Save to database
    session.add(response)
    session.add(query)
    await session.commit()
    await session.refresh(response)
    
    return ReviewResponse(
        id=response.id,
        query_id=query.query_id,
        query_text=query.query_text,
        response_text=response.response_text,
        is_approved=response.is_approved,
        doctor_notes=response.doctor_notes,
        status=query.status
    )


@router.get("/pending", response_model=List[ReviewResponse])
async def list_pending_reviews(
    limit: int = 10,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    List all responses pending doctor review.
    Only doctors and admins can access this endpoint.
    """
    # Only doctors and admins can access pending reviews
    if role not in [RoleEnum.DOCTOR, RoleEnum.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can access pending reviews"
        )
    
    # Get queries that need review
    query_result = await session.exec(
        Query.select.where(Query.status == StatusEnum.NEEDS_REVIEW)
        .offset(offset).limit(limit)
    )
    queries = query_result.all()
    
    # Get the latest response for each query
    reviews = []
    for query in queries:
        response_result = await session.exec(
            Response.select.where(Response.query_id == query.id)
            .order_by(Response.created_at.desc())
        )
        response = response_result.first()
        
        if response:
            reviews.append(
                ReviewResponse(
                    id=response.id,
                    query_id=query.query_id,
                    query_text=query.query_text,
                    response_text=response.response_text,
                    is_approved=response.is_approved,
                    doctor_notes=response.doctor_notes,
                    status=query.status
                )
            )
    
    return reviews


@router.put("/{response_id}", response_model=ReviewResponse)
async def update_review(
    response_id: int,
    review_data: ReviewUpdate,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Update a review with doctor approval or rejection.
    Only doctors can approve or reject reviews.
    """
    # Only doctors can approve or reject reviews
    if role != RoleEnum.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can approve or reject reviews"
        )
    
    # Get the response
    response_result = await session.exec(Response.select.where(Response.id == response_id))
    response = response_result.first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response with ID {response_id} not found"
        )
    
    # Get the associated query
    query_result = await session.exec(Query.select.where(Query.id == response.query_id))
    query = query_result.first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated query not found"
        )
    
    # Update response with doctor's review
    response.is_approved = review_data.is_approved
    response.doctor_notes = review_data.doctor_notes
    
    # Update query status based on approval
    if review_data.is_approved:
        query.status = StatusEnum.APPROVED
    else:
        query.status = StatusEnum.REJECTED
    
    # Save changes
    session.add(response)
    session.add(query)
    await session.commit()
    await session.refresh(response)
    
    return ReviewResponse(
        id=response.id,
        query_id=query.query_id,
        query_text=query.query_text,
        response_text=response.response_text,
        is_approved=response.is_approved,
        doctor_notes=response.doctor_notes,
        status=query.status
    )


@router.get("/{query_id}", response_model=ReviewResponse)
async def get_latest_review(
    query_id: str,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Get the latest review for a specific query.
    """
    # Get the query
    query_result = await session.exec(Query.select.where(Query.query_id == query_id))
    query = query_result.first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query with ID {query_id} not found"
        )
    
    # Get the latest response for the query
    response_result = await session.exec(
        Response.select.where(Response.query_id == query.id)
        .order_by(Response.created_at.desc())
    )
    response = response_result.first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No response found for query with ID {query_id}"
        )
    
    return ReviewResponse(
        id=response.id,
        query_id=query.query_id,
        query_text=query.query_text,
        response_text=response.response_text,
        is_approved=response.is_approved,
        doctor_notes=response.doctor_notes,
        status=query.status
    )
