"""Pydantic schemas for PiplineHistory."""

from datetime import date, datetime, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator
from app.core.enums import PipelineStatus
from app.core.timeutils import to_z


class PipelineHistoryBase(BaseModel):
    """Base schema for PipelineHistory."""

    from_status: Optional[PipelineStatus] = Field(
        default=None,
        description="Previous status (nullable for first transition).",
    )
    to_status: PipelineStatus = Field(
        ...,
        description="Target status the application moved into.",
    )
    transition_date: Optional[date] = Field(
        ...,
        description="Date the status transition occurred. Time portion is ignored.",
    )
    note: Optional[str] = Field(
        default=None,
        description="Optional human note describing the change.",
        max_length=2000,
    )


class PipelineHistoryCreate(PipelineHistoryBase):
    """
    Schema for creating a new pipeline history record.
    For nested POST; application_id comes from the path.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "application_id": 42,
                "transition_date": "2025-09-01",
                "from_status": PipelineStatus.WILL_APPLY.value,
                "to_status": PipelineStatus.APPLIED.value,
                "note": "Applied via company website",
            }
        }
    )

    @field_validator("transition_date")
    @classmethod
    def _no_future(cls, v: date | None) -> date | None:
        if v and v > datetime.now(timezone.utc).date():
            raise ValueError("transition_date cannot be in the future")
        return v


class PipelineHistoryCreateFlat(PipelineHistoryBase):
    """Schema for creating a new pipeline history record (flat)."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transition_date": "2025-09-01",
                "from_status": PipelineStatus.WILL_APPLY.value,
                "to_status": PipelineStatus.APPLIED.value,
                "note": "Applied via company website",
            }
        }
    )

    application_id: int = Field(
        ..., description="Application id to attach this history to."
    )


class PipelineHistoryUpdate(BaseModel):
    """
    Schema for updating a pipeline history record.

    Only `note` and `transition_date` may be updated. Attempts to change status fields are ignored by the router.
    """

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "example": {
                "transition_date": "2025-08-31",
                "note": "Updating audit trail notes.",
            }
        },
    )

    transition_date: Optional[date] = Field(
        default=None,
        description="Date the status transition occurred. Time portion is ignored.",
    )

    note: Optional[str] = Field(
        default=None,
        description="New note. If omitted, note remains unchanged.",
        max_length=2000,
    )


class PipelineHistoryRead(PipelineHistoryBase):
    """Schema for pipeline history with all fields."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 101,
                "application_id": 42,
                "transition_date": "2025-09-01",
                "from_status": PipelineStatus.APPLIED.value,
                "to_status": PipelineStatus.STAGE_1.value,
                "note": "Recruiter screen scheduled",
                "changed_at": "2025-09-02T15:04:05Z",
            }
        },
    )

    id: int
    application_id: int
    changed_at: datetime

    @field_serializer("changed_at", when_used="json")
    def _s_changed(self, v: datetime, _info):
        return to_z(v)
