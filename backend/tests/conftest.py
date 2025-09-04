"""Configuration for testing environment."""

import os
import tempfile
from datetime import date, datetime, timezone
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.enums import InterviewType
from app.data.database import Base
from app.main import app
from app.api.v1.applications import get_db as get_applications_db
from app.api.v1.contacts import get_db as get_contacts_db
from app.api.v1.interviews import get_db as get_interviews_db
from app.models.models import Applications, Contacts, Interviews
from app.core.enums import JobLocation, PipelineStatus, ResolutionStatus


@pytest.fixture(scope="session")
def _tmp_db_path():
    """Creates a temporary file-backed SQLite so all threads share the same DB."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        yield path
    finally:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass


@pytest.fixture(scope="session")
def engine(_tmp_db_path):
    """Creates a new SQLAlchemy engine instance."""
    url = f"sqlite:///{_tmp_db_path}"
    engine = create_engine(url, connect_args={"check_same_thread": False})

    # Enforce FKs on SQLite
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(engine):
    """Creates a new test database session."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Creates a new test client."""
    # Override FastAPI's get_db with our test session
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_applications_db] = _override_get_db
    app.dependency_overrides[get_contacts_db] = _override_get_db
    app.dependency_overrides[get_interviews_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def make_application(db_session):
    """Create an Applications row directly via ORM."""

    def _make(**overrides):
        obj = Applications(
            date_applied=overrides.pop("date_applied", date.today()),
            company=overrides.pop("company", "SeedCo"),
            role=overrides.pop("role", "SWE"),
            url=overrides.pop("url", "https://example.com/seed"),
            salary_min=overrides.pop("salary_min", None),
            salary_max=overrides.pop("salary_max", None),
            salary_target=overrides.pop("salary_target", None),
            job_location=overrides.pop("job_location", JobLocation.REMOTE),
            pipeline_status=overrides.pop("pipeline_status", PipelineStatus.APPLIED),
            next_follow_up_date=overrides.pop("next_follow_up_date", None),
            resolution_status=overrides.pop(
                "resolution_status", ResolutionStatus.ONGOING
            ),
            resolution_date=overrides.pop("resolution_date", None),
            notes=overrides.pop("notes", None),
            **overrides,
        )
        db_session.add(obj)
        db_session.commit()
        db_session.refresh(obj)
        return obj

    return _make


@pytest.fixture
def make_contact(db_session):
    """Create a Contacts row directly via ORM."""

    def _make(**overrides):
        obj = Contacts(
            name=overrides.pop("name", "Jordan Recruiter"),
            company=overrides.pop("company", "Acme"),
            email=overrides.pop("email", "jordan@acme.com"),
            title=overrides.pop("title", "Recruiter"),
            url=overrides.pop("url", "https://acme.com/jordan"),
            role=overrides.pop("role", "recruiter"),
            phone=overrides.pop("phone", "+15125551212"),
            notes=overrides.pop("notes", "seed"),
            **overrides,
        )
        db_session.add(obj)
        db_session.commit()
        db_session.refresh(obj)
        return obj

    return _make


@pytest.fixture
def make_interview(db_session, make_application):
    """Create an Interviews row directly via ORM (avoids POST dependency)."""

    def _make(**overrides):
        application = overrides.pop("application", None) or make_application()
        obj = Interviews(
            application_id=overrides.pop("application_id", application.id),
            scheduled_date=overrides.pop("scheduled_date", datetime.now(timezone.utc)),
            type=overrides.pop("type", InterviewType.RECRUITER),
            notes=overrides.pop("notes", "seed"),
            **overrides,
        )
        db_session.add(obj)
        db_session.commit()
        db_session.refresh(obj)
        return obj

    return _make


# ---- Optional: compatibility aliases if you referenced get_test_* elsewhere ----
# @pytest.fixture
# def get_test_engine(engine):
#     return engine


# @pytest.fixture
# def get_test_db_session(db_session):
#     return db_session


# @pytest.fixture
# def get_test_client(client):
#     return client
