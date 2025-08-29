"""SQLAlchemy ORM models for the Job Search Tracker backend.

This module defines the relational schema for the app, including:
- Enumerations for standardizing domain values (interview types, job location, pipeline,
  resolution).
- Core entities:
    - Application: A job application the user has created/tracked.
    - Contact: A person associated with an application (recruiter, hiring manager, etc.).
    - Interview: A scheduled interview tied to an application.
    - PipelineHistory: A historical record of changes to an application’s pipeline
      status (audit/history log).
- Many-to-many relationship between Applications and Contacts via `application_contacts`.
- Basic integrity constraints on salary fields.

Relationships:
- `Application.interviews` (1-to-many): An application has zero or more interviews.
- `Application.contacts` (many-to-many): An application is linked to one or more contacts,
  and vice versa.
- `PipelineHistory` references `Application` to record timestamped transitions
  (from_status → to_status).

This schema supports:
- Tracking the full lifecycle of a job application (status changes over time).
- Managing multiple interviews per application.
- Assigning multiple contacts per application.
- Storing basic salary expectations and links to job postings.

Note:
- This is optimized for a dev-phase app; migrations are out-of-scope for now.
- SQLite-compatible, but should generalize to Postgres later with minimal changes.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Date,
    Table,
    Text,
    Enum as SqlEnum,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.data.database import Base
from app.core.enums import InterviewType, JobLocation, PipelineStatus, ResolutionStatus


# Association table for many-to-many between Application and Contact.
application_contacts = Table(
    "application_contacts",
    Base.metadata,
    Column(
        "application_id", Integer, ForeignKey("applications.id", ondelete="CASCADE")
    ),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="CASCADE")),
)


class Application(Base):
    """Represents a single job application entry being tracked."""

    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    date_applied = Column(Date)
    company = Column(String, nullable=False, index=True)
    recruiting_agency = Column(String)
    role = Column(String, nullable=False)
    url = Column(String)

    salary_min = Column(Integer)
    salary_max = Column(Integer)
    salary_target = Column(Integer)

    job_location = Column(SqlEnum(JobLocation))
    pipeline_status = Column(SqlEnum(PipelineStatus), nullable=False, index=True)
    next_follow_up_date = Column(Date)
    resolution_status = Column(SqlEnum(ResolutionStatus), nullable=False, index=True)
    resolution_date = Column(Date)
    notes = Column(Text)

    # Relationships
    interviews = relationship(
        "Interview", back_populates="application", cascade="all, delete-orphan"
    )

    contacts = relationship(
        "Contact", secondary=application_contacts, back_populates="applications"
    )

    __table_args__ = (
        # Salary constraints to avoid nonsensical input
        CheckConstraint(
            "salary_min IS NULL OR salary_min >= 0", name="salary_min_nonneg"
        ),
        CheckConstraint(
            "salary_max IS NULL OR salary_max >= salary_min", name="salary_bounds_valid"
        ),
    )


class Contact(Base):
    """A person associated with an application (e.g., recruiter, hiring manager)."""

    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    name = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    email = Column(String, index=True)
    title = Column(String)
    url = Column(String)
    role = Column(String)  # e.g. 'recruiter', 'hiring_manager'
    phone = Column(String)
    notes = Column(Text)

    applications = relationship(
        "Application", secondary=application_contacts, back_populates="contacts"
    )


class Interview(Base):
    """A scheduled interview for an application (with notes)."""

    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    application_id = Column(
        Integer, ForeignKey("applications.id"), nullable=False, index=True
    )
    scheduled_date = Column(DateTime, nullable=False)
    type = Column(SqlEnum(InterviewType), nullable=False)
    notes = Column(Text)

    application = relationship("Application", back_populates="interviews")


class PipelineHistory(Base):
    """Immutable audit log of pipeline transitions for an application.

    Each record captures:
      - When it changed (`changed_at`)
      - From which status (nullable to handle initial state)
      - To which status
      - Optional human note
    """

    __tablename__ = "pipeline_history"

    id = Column(Integer, primary_key=True)
    application_id = Column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    changed_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    from_status = Column(SqlEnum(PipelineStatus), nullable=True)
    to_status = Column(SqlEnum(PipelineStatus), nullable=False)
    note = Column(Text)
