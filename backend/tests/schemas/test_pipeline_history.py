"""Tests for PipelineHistory Schemas"""

from datetime import datetime, timezone, timedelta
import pytest
from pydantic import ValidationError

from app.schemas.pipeline_history import (
    PipelineHistoryCreate,
    PipelineHistoryRead,
    PipelineHistoryUpdate,
    PipelineHistoryCreateFlat,
)
from app.core.enums import PipelineStatus


def test_pipeline_history_create_valid():
    """Test that PipelineHistoryCreate schema is valid with all required fields."""
    m = PipelineHistoryCreate(
        from_status=PipelineStatus.WILL_APPLY,
        to_status=PipelineStatus.APPLIED,
        note="Applied via site",
    )
    assert m.from_status == PipelineStatus.WILL_APPLY
    assert m.to_status == PipelineStatus.APPLIED
    assert m.note == "Applied via site"


def test_pipeline_history_flat_create_requires_app_id():
    """Test that PipelineHistoryCreateFlat schema requires application_id."""
    with pytest.raises(ValidationError):
        PipelineHistoryCreateFlat(
            from_status=PipelineStatus.WILL_APPLY,
            to_status=PipelineStatus.APPLIED,
            note="Missing app id",
            # application_id omitted -> should error when used by endpoint, or used by model directly
        )


def test_pipeline_history_update_only_note():
    """Test that PipelineHistoryUpdate schema is valid with only the note field."""
    u = PipelineHistoryUpdate(note="Audit note")
    dumped = u.model_dump(exclude_unset=True)
    assert dumped == {"note": "Audit note"}

    # No other fields allowed in the model; trying to pass them should be ignored by router anyway
    with pytest.raises(ValidationError):
        PipelineHistoryUpdate(**{"to_status": PipelineStatus.OFFERED})


def test_pipeline_history_read_shape():
    """Test that PipelineHistoryRead schema correctly validates and parses input data."""
    payload = {
        "id": 9,
        "application_id": 42,
        "from_status": PipelineStatus.APPLIED,
        "to_status": PipelineStatus.STAGE_1,
        "note": "Phone screen scheduled",
        "changed_at": datetime.now(timezone.utc) - timedelta(minutes=10),
    }
    r = PipelineHistoryRead(**payload)
    assert r.id == 9
    assert r.application_id == 42
    assert r.to_status == PipelineStatus.STAGE_1
    assert isinstance(r.changed_at, datetime)
