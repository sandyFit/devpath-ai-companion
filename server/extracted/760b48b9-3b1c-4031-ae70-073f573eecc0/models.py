from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
import enum
import uuid


class RoleEnum(str, enum.Enum):
    """
    Enum for user roles in the system.
    """
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class StatusEnum(str, enum.Enum):
    """
    Enum for query status in the system.
    """
    PENDING = "pending"
    PROCESSING = "processing"
    NEEDS_REVIEW = "needs_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class TriageLevelEnum(str, enum.Enum):
    """
    Enum for triage levels in the system.
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class UserBase(SQLModel):
    """
    Base model for user data.
    """
    name: str
    email: str
    role: RoleEnum


class User(UserBase, table=True):
    """
    User model for database storage.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    queries: List["Query"] = Relationship(back_populates="user")


class QueryBase(SQLModel):
    """
    Base model for query data.
    """
    query_text: str
    enhanced_query: Optional[str] = None
    status: StatusEnum = StatusEnum.PENDING
    triage_level: Optional[TriageLevelEnum] = None
    safety_score: Optional[float] = None
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class Query(QueryBase, table=True):
    """
    Query model for database storage.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="queries")
    responses: List["Response"] = Relationship(back_populates="query")
    files: List["File"] = Relationship(back_populates="query")


class ResponseBase(SQLModel):
    """
    Base model for response data.
    """
    response_text: str
    is_approved: bool = False
    doctor_notes: Optional[str] = None
    query_id: int = Field(foreign_key="query.id")


class Response(ResponseBase, table=True):
    """
    Response model for database storage.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    query: Query = Relationship(back_populates="responses")


class FileBase(SQLModel):
    """
    Base model for file data.
    """
    original_filename: str
    stored_filename: str
    file_type: str
    file_size: int
    file_hash: str
    summary: Optional[str] = None
    query_id: int = Field(foreign_key="query.id")


class File(FileBase, table=True):
    """
    File model for database storage.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expiry_time: datetime
    
    # Relationships
    query: Query = Relationship(back_populates="files")