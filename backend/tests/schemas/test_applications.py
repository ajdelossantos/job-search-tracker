"""Applications Schema tests."""

from datetime import date, datetime, timedelta, timezone
import pytest
from pydantic import ValidationError
from app.schemas.applications import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationRead,
)
from app.core.enums import JobLocation, PipelineStatus, ResolutionStatus, InterviewType


def test_application_create_valid():
    """Test valid application creation."""
    m = ApplicationCreate(
        date_applied=date(2025, 9, 1),
        company="Circuit",
        role="Senior Frontend Engineer",
        url="https://example.com/jobs/123",
        salary_min=135000,
        salary_max=150000,
        salary_target=150000,
        job_location=JobLocation.REMOTE,  # enum instance works
        pipeline_status=PipelineStatus.WILL_APPLY,  # enum instance works
        next_follow_up_at="2025-09-08T16:00:00Z",
        resolution_status=ResolutionStatus.ONGOING,
        notes="ok",
    )
    assert m.company == "Circuit"
    assert str(m.url) == "https://example.com/jobs/123"
    assert m.salary_min <= m.salary_max


def test_application_create_salary_bounds_invalid():
    """Test invalid salary bounds."""
    with pytest.raises(ValidationError):
        ApplicationCreate(
            date_applied=date.today(),
            company="Bad Co",
            role="SWE",
            job_location=JobLocation.REMOTE,
            pipeline_status=PipelineStatus.APPLIED,
            resolution_status=ResolutionStatus.ONGOING,
            salary_min=200000,
            salary_max=100000,
        )


def test_application_update_partial_excludes_unset():
    """Test partial update excludes unset fields."""
    u = ApplicationUpdate(notes="only this")
    d = u.model_dump(exclude_unset=True)
    assert d == {"notes": "only this"}


def test_application_read_nested_and_defaults():
    """Test reading application with nested and default values."""
    payload = {
        "id": 1,
        "date_applied": str(date.today()),
        "company": "Acme",
        "role": "SWE",
        "url": "https://example.com",
        "job_location": JobLocation.REMOTE.value,
        "pipeline_status": PipelineStatus.APPLIED.value,
        "resolution_status": ResolutionStatus.ONGOING.value,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "updated_at": (datetime.now(timezone.utc) + timedelta(minutes=1))
        .isoformat()
        .replace("+00:00", "Z"),
        "interviews": [
            {
                "id": 10,
                "application_id": 1,
                "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=1))
                .isoformat()
                .replace("+00:00", "Z"),
                "type": InterviewType.RECRUITER.value,
                "notes": "Recruiter call",
                "created_at": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "updated_at": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
            }
        ],
        "contacts": [
            {
                "id": 2,
                "name": "Jordan",
                "company": "Acme",
                "email": "jordan@acme.com",
                "title": "Recruiter",
                "role": "recruiter",
                "created_at": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "updated_at": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
            }
        ],
        "pipeline_histories": [
            {
                "id": 5,
                "application_id": 1,
                "changed_at": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                "from_status": PipelineStatus.WILL_APPLY.value,
                "to_status": PipelineStatus.APPLIED.value,
                "note": "Applied online",
            }
        ],
    }
    r = ApplicationRead(**payload)
    # lists exist and have right shapes
    assert isinstance(r.interviews, list) and r.interviews[0].id == 10
    assert isinstance(r.contacts, list) and r.contacts[0].name == "Jordan"
    assert (
        isinstance(r.pipeline_histories, list)
        and r.pipeline_histories[0].to_status.name == "APPLIED"
    )

    # dump to JSON-safe values (enums -> their values)
    dumped = r.model_dump()
    assert dumped["pipeline_status"] == PipelineStatus.APPLIED.value
    assert dumped["interviews"][0]["type"] == InterviewType.RECRUITER.value


def test_application_read_list_defaults_are_safe():
    """Test application read list defaults are safe."""
    # ensure new instances don't share list objects
    a = ApplicationRead(
        id=1,
        date_applied=date.today(),
        company="ABC",
        role="Recruiter",
        job_location=JobLocation.REMOTE,
        pipeline_status=PipelineStatus.APPLIED,
        resolution_status=ResolutionStatus.ONGOING,
        created_at=datetime.now(timezone.utc),
    )
    b = ApplicationRead(
        id=2,
        date_applied=date.today(),
        company="XYZ",
        role="Recruiter",
        job_location=JobLocation.REMOTE,
        pipeline_status=PipelineStatus.APPLIED,
        resolution_status=ResolutionStatus.ONGOING,
        created_at=datetime.now(timezone.utc),
    )
    a.contacts.append(type("X", (), {"id": 99})())  # fake minimal object
    assert len(a.contacts) == 1
    assert b.contacts == []  # proves no shared default list
