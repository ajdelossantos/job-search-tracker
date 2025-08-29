"""Test configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.data.database import Base
from app.models.models import Application, Contact, Interview

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

client = TestClient(app)

def override_get_db():
    """Override the database session for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture
def test_application():
    """Create a test application."""
    application = Application(
        date_applied="2023-10-01",
        company="Test Company",
        role="Software Engineer",
        pipeline_status="applied",
        resolution_status="ongoing"
    )

    db = TestingSessionLocal()
    db.add(application)
    db.commit()

    yield application
    with engine.connect() as conn:
        conn.execute("DELETE FROM applications")
        conn.commit()

@pytest.fixture
def test_contact():
    """Create a test contact."""
    contact = Contact(
        name="John Doe",
        company="Test Company",
    )

    db = TestingSessionLocal()
    db.add(contact)
    db.commit()

    yield contact
    with engine.connect() as conn:
        conn.execute("DELETE FROM contacts")
        conn.commit()

@pytest.fixture
def test_interview():
    """Create a test interview."""
    interview = Interview(
        application_id=1,
        scheduled_date="2023-10-15",
        type="technical",
        notes="Technical interview"
    )

    db = TestingSessionLocal()
    db.add(interview)
    db.commit()

    yield interview
    with engine.connect() as conn:
        conn.execute("DELETE FROM interviews")
        conn.commit()
