"""Pydantic schemas for PiplineHistory."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from ..core.enums import PipelineStatus


class PipelineHistoryBase(BaseModel):
    """Base schema for PipelineHistory."""
    from_status: Optional[PipelineStatus] = None
    to_status: PipelineStatus
    note: Optional[str] = None


class PipelineHistoryCreate(PipelineHistoryBase):
    """Schema for creating a new pipeline history record."""
    application_id: int


class PipelineHistory(PipelineHistoryBase):
    """Schema for pipeline history with all fields."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    changed_at: datetime
