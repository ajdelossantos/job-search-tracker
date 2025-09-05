"""Pydantic models for interviews."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from ..core.enums import InterviewType


class InterviewBase(BaseModel):
    """Base model for interview schema."""

    scheduled_date: datetime = Field(..., description="Timezone-aware datetime")
    type: InterviewType
    notes: Optional[str] = None

    @model_validator(mode="after")
    def _tz_required(self):
        """Ensure scheduled_date is timezone-aware."""
        if self.scheduled_date.tzinfo is None:  # pylint: disable=E1101
            raise ValueError("scheduled_date must be timezone-aware (e.g., '...Z').")
        return self


class InterviewCreateFlat(InterviewBase):
    """Schema for creating a new Interview (flat)."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "scheduled_date": "2025-09-05T19:00:00Z",
                "type": InterviewType.RECRUITER.value,
                "notes": "Recruiter call",
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


class InterviewUpdate(BaseModel):
    """Schema for updating a new Interview"""

    scheduled_date: Optional[datetime] = None
    type: Optional[InterviewType] = None
    notes: Optional[str] = None
    application_id: Optional[int] = None  # allow reassign (optional)

    @model_validator(mode="after")
    def _tz_required_if_present(self):
        """Ensure scheduled_date is timezone-aware if present."""
        if self.scheduled_date is not None and self.scheduled_date.tzinfo is None:  # pylint: disable=E1101
            raise ValueError("scheduled_date must be timezone-aware (e.g., '...Z').")
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
