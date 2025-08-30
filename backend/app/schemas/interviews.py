"""Pydantic models for interviews."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from ..core.enums import InterviewType


class InterviewBase(BaseModel):
    """Base model for interview schema."""
    scheduled_date: datetime
    type: InterviewType
    notes: Optional[str]


class InterviewCreate(InterviewBase):
    """Schema for creating a new Interview."""
    pass


class InterviewUpdate(BaseModel):
    """Schema for updating a new Interview"""
    pass


class Interview(InterviewBase):
    """Represents a Interview entity with its associated attributes."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    created_at: datetime
    updated_at: datetime
