"""Models for job search tracker app."""

from enum import Enum
from sqlalchemy import (Column, Integer, String, ForeignKey, DateTime,
                        Date, Table, Text, Boolean, Enum as SqlEnum)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .data.database import Base


class InterviewType(str, Enum):
    """Represents the type of a job interview."""
    BEHAVIORAL = "behavioral"
    FINAL = "final"
    HIRING_MANAGER = "hiring_manager"
    OFFER = "offer"
    OFFER_NEGOTIATION = "offer_negotiation"
    RECRUITER = "recruiter"
    TECHNICAL = "technical"


class JobLocation(str, Enum):
    """Represents a location requirement for a job application."""
    HYBRID = "hybrid"
    ONSITE = "onsite"
    REMOTE = "remote"


class PipelineStatus(str, Enum):
    """A job pipeline status."""
    APPLIED = "applied"
    FINAL_ROUND = "final_round"
    OFFERED = "offered"
    RESOLVED = "resolved"
    STAGE_1 = "stage_1"
    STAGE_2 = "stage_2"
    STAGE_3_PLUS = "stage_3_plus"
    WILL_APPLY = "will_apply"


class ResolutionStatus(str, Enum):
    """A job resolution status."""
    GHOSTED = "ghosted"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    ONGOING = "ongoing"
    ON_HOLD = "on_hold"
    REJECTED = "rejected"


application_contacts = Table(
    "application_contacts",
    Base.metadata,
    Column(
        "application_id", Integer, ForeignKey("applications.id", ondelete="CASCADE")
    ),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="CASCADE")),
    Column("is_primary", Boolean, default=False),
)


class Application(Base):
    """Represents a job application."""
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
    next_follow_up_date = Column(Date)  # ISO format date string
    resolution_status = Column(SqlEnum(ResolutionStatus), nullable=False, index=True)
    resolution_date = Column(Date)  # ISO format date string
    notes = Column(Text)

    interviews = relationship("Interview", back_populates="application",
                              cascade="all, delete-orphan")
    contacts = relationship("Contact", secondary=application_contacts,
                            back_populates="applications")


class Contact(Base):
    """Represents a contact related to a job application."""
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    name = Column(String, nullable=False, index=True)
    company = Column(String, nullable=False)
    email = Column(String, index=True)
    title = Column(String)
    url = Column(String)
    role = Column(String)
    phone = Column(String)
    notes = Column(Text)

    applications = relationship("Application", secondary=application_contacts,
                                back_populates="contacts")


class Interview(Base):
    """Represents a job interview."""
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
