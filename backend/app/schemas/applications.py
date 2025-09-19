"""Pydantic schemas for Applications."""

from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, HttpUrl, Field, model_validator
from app.core.enums import InterviewType, JobLocation, PipelineStatus, ResolutionStatus
from app.schemas.contacts import ContactRead
from app.schemas.interviews import InterviewRead
from app.schemas.pipeline_history import PipelineHistoryRead


class ApplicationBase(BaseModel):
    """Base for Application Model."""

    date_applied: date
    company: str = Field(min_length=3)
    recruiting_agency: Optional[str] = None
    role: str = Field(min_length=3)
    url: Optional[HttpUrl] = None

    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_target: Optional[int] = Field(None, ge=0)

    job_location: JobLocation
    pipeline_status: PipelineStatus = PipelineStatus.WILL_APPLY
    next_follow_up_at: Optional[datetime] = None
    resolution_status: ResolutionStatus = ResolutionStatus.ONGOING
    resolution_date: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_salary_bounds(self):
        """Validates that salary_max is greater than or equal to salary_min."""
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("salary_max must be >= salary_min")
        return self


class ApplicationCreate(ApplicationBase):
    """Schema for creating a new application."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "date_applied": "2025-09-01",
                "company": "Circuit",
                "role": "Senior Frontend Engineer",
                "url": "https://example.com/jobs/123",
                "salary_min": 135000,
                "salary_max": 150000,
                "salary_target": 150000,
                "job_location": JobLocation.REMOTE.value,
                "pipeline_status": PipelineStatus.WILL_APPLY.value,
                "next_follow_up_at": "2025-09-08T16:00:00Z",
                "resolution_status": ResolutionStatus.ONGOING.value,
                "notes": "Saw role via referral; prep phone screen.",
            }
        }
    )


class ApplicationUpdate(ApplicationBase):
    """Schema for updating an existing application, all fields optional."""

    date_applied: Optional[date] = None
    company: Optional[str] = Field(None, min_length=3)
    recruiting_agency: Optional[str] = None
    role: Optional[str] = Field(None, min_length=3)
    url: Optional[HttpUrl] = None

    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_target: Optional[int] = Field(None, ge=0)

    job_location: Optional[JobLocation] = None
    pipeline_status: Optional[PipelineStatus] = None
    next_follow_up_at: Optional[datetime] = None
    resolution_status: Optional[ResolutionStatus] = None
    resolution_date: Optional[date] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_salary_bounds(self):
        """Validates that salary_max is greater than or equal to salary_min."""
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("salary_max must be >= salary_min")
        return self


class ApplicationRead(ApplicationBase):
    """Represents an application entity with its associated attributes."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 42,
                "date_applied": "2025-09-01",
                "company": "Circuit",
                "role": "Senior Frontend Engineer",
                "url": "https://example.com/jobs/123",
                "salary_min": 150000,
                "salary_max": 190000,
                "salary_target": 180000,
                "job_location": JobLocation.REMOTE.value,
                "pipeline_status": PipelineStatus.APPLIED.value,
                "next_follow_up_at": "2025-09-08T16:00:00Z",
                "resolution_status": ResolutionStatus.ONGOING.value,
                "created_at": "2025-09-02T15:04:05Z",
                "updated_at": "2025-09-02T16:00:00Z",
                "notes": "Intro screen this week",
                "interviews": [
                    {
                        "id": 7,
                        "application_id": 42,
                        "scheduled_date": "2025-09-05T19:00:00Z",
                        "type": InterviewType.RECRUITER.value,
                        "notes": "Recruiter call",
                        "created_at": "2025-09-02T15:04:05Z",
                        "updated_at": "2025-09-02T16:00:00Z",
                    }
                ],
                "contacts": [
                    {
                        "id": 3,
                        "name": "Jordan Lee",
                        "company": "Circuit",
                        "title": "Recruiter",
                        "email": "jordan@circuit.com",
                        "role": "recruiter",
                        "created_at": "2025-09-02T15:04:05Z",
                        "updated_at": "2025-09-02T16:00:00Z",
                    }
                ],
                "pipeline_histories": [
                    {
                        "id": 11,
                        "changed_at": "2025-09-02T15:04:05Z",
                        "from_status": PipelineStatus.WILL_APPLY.value,
                        "to_status": PipelineStatus.APPLIED.value,
                        "note": "Applied via site",
                    }
                ],
            }
        },
    )

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    interviews: List[InterviewRead] = Field(default_factory=list)
    contacts: List[ContactRead] = Field(default_factory=list)
    pipeline_histories: List[PipelineHistoryRead] = Field(default_factory=list)
