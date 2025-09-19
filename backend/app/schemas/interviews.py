"""Pydantic models for interviews."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator
from app.core.enums import InterviewType
from app.core.timeutils import parse_required_aware_to_utc, to_z


class InterviewBase(BaseModel):
    """Base model for interview schema."""

    scheduled_date: datetime = Field(
        ..., description="Timezone-aware datetime(ISO 8601, e.g. 2025-09-05T19:00:00Z)"
    )
    type: InterviewType
    notes: Optional[str] = None


class InterviewCreateFlat(InterviewBase):
    """Schema for creating a new Interview (flat)."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "scheduled_date": "2025-09-05T19:00:00Z",
                "type": InterviewType.RECRUITER.value,
                "notes": "Recruiter call",
                "application_id": 42,
            }
        }
    )

    application_id: Optional[int] = None  # only used by flat POST


class InterviewCreate(InterviewBase):
    """Schema for creating a new Interview. For nested POST; application_id comes from the path."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "application_id": 69,
                "scheduled_date": "2025-09-05T19:00:00Z",
                "type": InterviewType.RECRUITER.value,
                "notes": "Recruiter call",
            }
        }
    )

    @model_validator(mode="after")
    def _normalize_scheduled_date(self):
        self.scheduled_date = parse_required_aware_to_utc(self.scheduled_date)
        return self


class InterviewUpdate(BaseModel):
    """Schema for updating a new Interview"""

    scheduled_date: Optional[datetime] = None
    type: Optional[InterviewType] = None
    notes: Optional[str] = None
    application_id: Optional[int] = None  # allow reassign (optional)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "scheduled_date": "2025-09-05T19:00:00Z",
                "type": InterviewType.RECRUITER.value,
                "notes": "Recruiter call",
                "application_id": 42,
            }
        }
    )

    @model_validator(mode="after")
    def _normalize_scheduled_date(self):
        if self.scheduled_date is not None:
            self.scheduled_date = parse_required_aware_to_utc(self.scheduled_date)
        return self


class InterviewRead(InterviewBase):
    """Represents a Interview entity with its associated attributes."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 7,
                "application_id": 42,
                "scheduled_date": "2025-09-05T19:00:00Z",
                "type": InterviewType.TECHNICAL.value,
                "notes": "Typical HankerRank-medium DSA garbage.",
                "created_at": "2025-09-02T15:04:05Z",
                "updated_at": "2025-09-02T16:00:00Z",
            }
        },
    )

    id: int
    application_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer("scheduled_date", when_used="json")
    def _s_sched(self, v: datetime, _info):
        return to_z(v)

    @field_serializer("created_at", when_used="json")
    def _s_created(self, v: datetime, _info):
        return to_z(v)

    @field_serializer("updated_at", when_used="json")
    def _s_updated(self, v: Optional[datetime], _info):
        return to_z(v)
