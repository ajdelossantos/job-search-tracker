# tests/conftest.py
import os
import tempfile
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.data.database import Base
from app.main import app
from app.api.v1.applications import get_db


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

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


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
