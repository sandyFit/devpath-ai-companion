import pytest
import asyncio
from httpx import AsyncClient
import os
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app
from db.database import init_db
from models.models import RoleEnum, StatusEnum, TriageLevelEnum

# Test data
TEST_QUERY = {
    "query_text": "I've been having headaches and dizziness for the past week. What could this be?"
}

@pytest.fixture(scope="module")
async def client():
    """Create a test client for the FastAPI app."""
    # Initialize the database
    await init_db()
    
    # Create an async test client
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_health_check(client):
    """Test the health check endpoint."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_create_query(client):
    """Test creating a new query."""
    # Test as patient
    response = await client.post(
        "/api/query/",
        json=TEST_QUERY,
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "query_id" in data
    assert data["query_text"] == TEST_QUERY["query_text"]
    assert "enhanced_query" in data
    assert "safety_score" in data
    assert "triage_level" in data
    assert "status" in data
    
    # Save query_id for later tests
    query_id = data["query_id"]
    
    # Test unauthorized role
    response = await client.post(
        "/api/query/",
        json=TEST_QUERY,
        headers={"X-User-Role": "invalid"}
    )
    
    assert response.status_code == 403
    
    return query_id

@pytest.mark.asyncio
async def test_get_query(client):
    """Test retrieving a query."""
    # First create a query
    query_id = await test_create_query(client)
    
    # Test as patient
    response = await client.get(
        f"/api/query/{query_id}",
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["query_id"] == query_id
    assert data["query_text"] == TEST_QUERY["query_text"]
    
    # Test with invalid query ID
    response = await client.get(
        "/api/query/999999",
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_list_queries(client):
    """Test listing queries."""
    # Test as doctor
    response = await client.get(
        "/api/query/",
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Test with status filter
    response = await client.get(
        "/api/query/?status=pending",
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for query in data:
        assert query["status"] == "pending"
    
    # Test as patient (unauthorized)
    response = await client.get(
        "/api/query/",
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_file_upload(client):
    """Test file upload functionality."""
    # First create a query
    query_id = await test_create_query(client)
    
    # Create a test file
    test_file_content = "This is a test file for medical records."
    test_file = {"file": ("test.txt", test_file_content.encode(), "text/plain")}
    
    # Test file upload
    response = await client.post(
        f"/api/file/upload/{query_id}",
        files=test_file,
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    assert data["original_filename"] == "test.txt"
    assert data["file_type"] == "text/plain"
    
    # Save file_id for later tests
    file_id = data["file_id"]
    
    return query_id, file_id

@pytest.mark.asyncio
async def test_get_files_for_query(client):
    """Test retrieving files for a query."""
    # First upload a file
    query_id, _ = await test_file_upload(client)
    
    # Test getting files for query
    response = await client.get(
        f"/api/file/query/{query_id}",
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["query_id"] == query_id

@pytest.mark.asyncio
async def test_download_file(client):
    """Test downloading a file."""
    # First upload a file
    _, file_id = await test_file_upload(client)
    
    # Test downloading the file
    response = await client.get(
        f"/api/file/download/{file_id}",
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 200
    assert response.content.decode() == "This is a test file for medical records."

@pytest.mark.asyncio
async def test_triage_endpoints(client):
    """Test triage-related endpoints."""
    # First create a query
    query_id = await test_create_query(client)
    
    # Test listing triaged queries as doctor
    response = await client.get(
        "/api/triage/",
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    
    # Test updating triage level
    response = await client.put(
        f"/api/triage/{query_id}",
        json={"triage_level": "HIGH"},
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["triage_level"] == "HIGH"
    assert data["status"] == "needs_review"  # Status should update based on triage
    
    # Test listing urgent queries
    response = await client.get(
        "/api/triage/urgent",
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_review_endpoints(client):
    """Test review-related endpoints."""
    # First create a query
    query_id = await test_create_query(client)
    
    # Generate a response for the query
    response = await client.post(
        "/api/review/generate",
        json={"query_id": query_id},
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["query_id"] == query_id
    assert "response_text" in data
    assert data["is_approved"] is False  # Should start as unapproved
    
    response_id = data["id"]
    
    # Test listing pending reviews
    response = await client.get(
        "/api/review/pending",
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    
    # Test approving a review
    response = await client.put(
        f"/api/review/{response_id}",
        json={"is_approved": True, "doctor_notes": "Looks good"},
        headers={"X-User-Role": "doctor"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_approved"] is True
    assert data["doctor_notes"] == "Looks good"
    
    # Test getting the latest review for a query
    response = await client.get(
        f"/api/review/{query_id}",
        headers={"X-User-Role": "patient"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["query_id"] == query_id
    assert data["is_approved"] is True
