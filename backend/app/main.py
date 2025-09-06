"""Entry point for job-search-tracker-server application."""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from .data.database import Base, engine
from .api.v1 import applications, contacts, interviews, pipeline_history

app = FastAPI(
    title="Job Search Tracker API",
    version="1.0.0",
    description="REST API for managing job applications, contacts, interviews, and pipeline history.",
)

"""
Expected dev origins for CORS

- In production, set specific allowed origins via environment variable or config
- (e.g. your deployed frontend URL)
- Avoid using "*" when allow_credentials=True
"""
DEV_ORIGINS = [
    "http://localhost:3000",  # Next.js/CRA
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=DEV_ORIGINS,  # use explicit origins, not "*", when credentials are involved
    allow_credentials=True,  # needed if you send cookies/Authorization headers from the browser
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    expose_headers=["Location"],  # useful: clients can read `Location` from responses
)

Base.metadata.create_all(bind=engine)


@app.get("/health-check", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    """Stubbed health check for testing."""
    return {"status": "Healthy"}


app.include_router(applications.router)
app.include_router(contacts.router)
app.include_router(interviews.router)
app.include_router(pipeline_history.router)
