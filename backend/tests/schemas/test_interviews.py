"""Unit tests for interview schemas."""

from datetime import datetime, timedelta, timezone
import pytest
from pydantic import ValidationError
from app.schemas.interviews import InterviewCreate, InterviewUpdate, InterviewRead
from app.core.enums import InterviewType


def test_interview_create_valid_utc():
    """Test valid interview creation with UTC datetime."""
    m = InterviewCreate(
        scheduled_date=datetime.now(timezone.utc) + timedelta(days=1),
        type=InterviewType.RECRUITER,
        notes="Prep resume",
    )
    assert m.type is InterviewType.RECRUITER
    assert m.scheduled_date.tzinfo is not None  # pylint: disable=no-member


def test_interview_create_rejects_naive_datetime():
    """Test that InterviewCreate rejects naive datetime."""
    with pytest.raises(ValidationError) as e:
        InterviewCreate(
            scheduled_date=datetime.utcnow(),  # naive
            type=InterviewType.RECRUITER,
        )
    assert "timezone-aware" in str(e.value)


def test_interview_update_partial_and_tz_enforced():
    """Test that InterviewUpdate enforces timezone awareness."""
    # partial update only notes
    u = InterviewUpdate(notes="Updated notes only")
    d = u.model_dump(exclude_unset=True)
    assert d == {"notes": "Updated notes only"}

    # updating scheduled_date requires tz awareness
    with pytest.raises(ValidationError):
        InterviewUpdate(scheduled_date=datetime.utcnow())  # naive


def test_interview_read_from_payload_and_dump():
    """Test that InterviewRead can be created from a payload and dumped back to a dict."""
    payload = {
        "id": 10,
        "application_id": 1,
        "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=2))
        .isoformat()
        .replace("+00:00", "Z"),
        "type": InterviewType.RECRUITER.value,  # value is fine
        "notes": "Screening",
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    r = InterviewRead(**payload)
    assert r.id == 10 and r.application_id == 1
    assert r.type == InterviewType.RECRUITER

    dumped = r.model_dump()
    assert (
        dumped["type"] == InterviewType.RECRUITER
    )  # enum preserved (pydantic v2 keeps enum)
    assert "scheduled_date" in dumped


def test_interview_type_must_be_valid():
    """Test that InterviewCreate rejects invalid interview types."""
    with pytest.raises(ValidationError):
        InterviewCreate(
            scheduled_date=datetime.now(timezone.utc),
            type="not_a_type",  # invalid
        )
