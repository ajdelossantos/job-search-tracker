"""Pydantic models for interviews."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from ..core.enums import InterviewType


class InterviewBase(BaseModel):
    """Base model for interview schema."""
    scheduled_date: datetime = Field(..., description="Timezone-aware datetime")
    type: InterviewType
    notes: Optional[str]

    @field_validator("scheduled_date")
    @classmethod
    def ensure_tz_aware(cls, v: datetime) -> datetime:
        # Be strict: DB column is timezone-aware; reject naive datetimes.
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("scheduled_date must be timezone-aware (e.g., '...Z').")
        return v


class InterviewCreate(InterviewBase):
    """Schema for creating a new Interview."""
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "scheduled_date": "2025-09-05T19:00:00Z",
            "type": InterviewType.RECRUITER.value,
            "notes": "Recruiter call",
        }
    })


class InterviewUpdate(BaseModel):
    """Schema for updating a new Interview"""
    scheduled_date: Optional[datetime] = None
    type: Optional[InterviewType] = None
    notes: Optional[str] = None

    @field_validator("scheduled_date")
    @classmethod
    def ensure_tz_aware(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return v
        if v.tzinfo is None or v.tzinfo.utcoffset(v) is None:
            raise ValueError("scheduled_date must be timezone-aware (e.g., '...Z').")
        return v


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
