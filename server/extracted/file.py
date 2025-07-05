from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Header
from fastapi.responses import FileResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import os
import hashlib
import uuid
from datetime import datetime, timedelta
import shutil
import magic

from db.database import get_session
from models import File, Query, RoleEnum

router = APIRouter()

# Configure file storage
UPLOAD_DIR = os.path.join(os.getcwd(), "data", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 5 * 1024 * 1024))  # 5MB default
FILE_EXPIRY_MINUTES = int(os.getenv("FILE_EXPIRY_MINUTES", 30))
ALLOWED_FILE_TYPES = os.getenv("ALLOWED_FILE_TYPES", ".pdf,.csv,.txt").split(",")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


class FileResponse(BaseModel):
    """
    Schema for file response.
    """
    id: int
    original_filename: str
    file_type: str
    file_size: int
    summary: Optional[str] = None
    created_at: datetime
    expiry_time: datetime


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


async def generate_file_summary(file_path: str, file_type: str) -> str:
    """
    Generate a summary of the file content using AI.
    This would typically call an AI agent to process the file.
    """
    # Mock implementation - in a real app, this would use an AI agent
    return f"This is a {file_type} file with sample medical data."


@router.post("/upload/{query_id}", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    query_id: str,
    file: UploadFile = FastAPIFile(...),
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Upload a file and associate it with a query.
    Files are stored with hashed filenames and are automatically purged after a set time.
    """
    # Check if query exists
    query_result = await session.exec(Query.select.where(Query.query_id == query_id))
    query = query_result.first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query with ID {query_id} not found"
        )
    
    # Validate file size
    file_size = 0
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the maximum allowed size of {MAX_FILE_SIZE} bytes"
        )
    
    # Reset file pointer
    await file.seek(0)
    
    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_FILE_TYPES)}"
        )
    
    # Generate a unique filename using hash
    file_hash = hashlib.sha256(file_content).hexdigest()
    unique_filename = f"{file_hash}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Detect MIME type
    mime_type = magic.Magic(mime=True).from_file(file_path)
    
    # Generate file summary
    summary = await generate_file_summary(file_path, mime_type)
    
    # Calculate expiry time
    expiry_time = datetime.utcnow() + timedelta(minutes=FILE_EXPIRY_MINUTES)
    
    # Create file record in database
    db_file = File(
        original_filename=file.filename,
        stored_filename=unique_filename,
        file_type=mime_type,
        file_size=file_size,
        file_hash=file_hash,
        summary=summary,
        query_id=query.id,
        expiry_time=expiry_time
    )
    
    session.add(db_file)
    await session.commit()
    await session.refresh(db_file)
    
    return FileResponse(
        id=db_file.id,
        original_filename=db_file.original_filename,
        file_type=db_file.file_type,
        file_size=db_file.file_size,
        summary=db_file.summary,
        created_at=db_file.created_at,
        expiry_time=db_file.expiry_time
    )


@router.get("/query/{query_id}", response_model=List[FileResponse])
async def get_files_for_query(
    query_id: str,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Get all files associated with a specific query.
    """
    # Check if query exists
    query_result = await session.exec(Query.select.where(Query.query_id == query_id))
    query = query_result.first()
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Query with ID {query_id} not found"
        )
    
    # Get files for the query
    files_result = await session.exec(File.select.where(File.query_id == query.id))
    files = files_result.all()
    
    return [
        FileResponse(
            id=file.id,
            original_filename=file.original_filename,
            file_type=file.file_type,
            file_size=file.file_size,
            summary=file.summary,
            created_at=file.created_at,
            expiry_time=file.expiry_time
        ) for file in files
    ]


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    session: AsyncSession = Depends(get_session),
    role: RoleEnum = Depends(verify_role)
):
    """
    Download a specific file by its ID.
    """
    # Get file from database
    file_result = await session.exec(File.select.where(File.id == file_id))
    file = file_result.first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File with ID {file_id} not found"
        )
    
    # Check if file has expired
    if datetime.utcnow() > file.expiry_time:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="File has expired and is no longer available"
        )
    
    # Check if file exists on disk
    file_path = os.path.join(UPLOAD_DIR, file.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )
    
    return FileResponse(
        path=file_path,
        filename=file.original_filename,
        media_type=file.file_type
    )
