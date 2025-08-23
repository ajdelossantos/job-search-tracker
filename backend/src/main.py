"""Entry point for job-search-tracker-server application."""

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    """Stub."""
    return {"message": "Hello job-search-tracker-server"}


@app.get("/health-check")
async def health_check():
    """Stubbed health check for testing."""
    return {"status": "Healthy"}
