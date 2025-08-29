"""Pydantic schemas for Applications."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, HttpUrl, Field
from pydantic_extra_types.currency_code import Currency
from app.core.enums import JobLocation, PipelineStatus, ResolutionStatus


class ApplicationBase(BaseModel):
    """Base for Application Model."""
    date_applied: date
    company: str
    recruiting_agency: Optional[str]
    role: str
    url: Optional[HttpUrl]

    salary_min: Optional[Currency] = Field(None, ge=0)
    salary_max: Optional[Currency] = Field(None, ge=0)
    salary_target: Optional[Currency] = Field(None, ge=0)

    job_location: JobLocation
    pipeline_status: PipelineStatus = PipelineStatus.WILL_APPLY
    next_follow_up_date: Optional[date]
    resolution_status: ResolutionStatus = ResolutionStatus.ONGOING
    resolution_date: Optional[date] = None
    notes: Optional[str]


class ApplicationCreate(ApplicationBase):
    """Schema for creating a new application."""
    pass


class ApplicationUpdate(ApplicationBase):
    """Schema for updating an existing application."""
    pass


class Application(ApplicationBase):
    """Represents an application entity with its associated attributes."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    interviews: list[int]
    contacts: list[int]
