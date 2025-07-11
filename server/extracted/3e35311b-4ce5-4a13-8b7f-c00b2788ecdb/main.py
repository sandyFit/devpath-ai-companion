import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Import database initialization
from db.init_db import init_db

# Import routes
from routes import query, file, triage, review


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for the FastAPI application.
    Initializes the database on startup.
    """
    # Initialize the database on startup
    await init_db()
    yield
    # Cleanup resources on shutdown if needed
    pass


# Create FastAPI app
app = FastAPI(
    title="Medical AI Assistant API",
    description="API for a medical AI assistant using multiple agents and MCP orchestration",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo purposes only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "RoleHeader": {
            "type": "apiKey",
            "in": "header",
            "name": "X-User-Role",
            "description": "Role-based access header (patient, doctor, admin)"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Include routers
app.include_router(query.router, prefix="/api/query", tags=["Query"])
app.include_router(file.router, prefix="/api/file", tags=["File"])
app.include_router(triage.router, prefix="/api/triage", tags=["Triage"])
app.include_router(review.router, prefix="/api/review", tags=["Review"])


@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "healthy", "message": "Medical AI Assistant API is running"}


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    
    uvicorn.run("main:app", host=host, port=port, reload=debug)
