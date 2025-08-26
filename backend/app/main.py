"""Entry point for job-search-tracker-server application."""

from fastapi import FastAPI
from .data.database import Base, engine
from .api.v1 import applications, contacts, interviews

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/health-check")
async def health_check():
    """Stubbed health check for testing."""
    return {"status": "Healthy"}


app.include_router(applications.router)
app.include_router(contacts.router)
app.include_router(interviews.router)
