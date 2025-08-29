"""Enums for all packages."""

from enum import Enum


class InterviewType(str, Enum):
    """Type/category of an interview event in the pipeline."""

    BEHAVIORAL = "behavioral"
    FINAL = "final"
    HIRING_MANAGER = "hiring_manager"
    OFFER = "offer"
    OFFER_NEGOTIATION = "offer_negotiation"
    RECRUITER = "recruiter"
    TECHNICAL = "technical"


class JobLocation(str, Enum):
    """Location modality for the job (as stated in the JD or negotiated)."""

    HYBRID = "hybrid"
    ONSITE = "onsite"
    REMOTE = "remote"


class PipelineStatus(str, Enum):
    """Pipeline status for an application (high-level stage)."""

    APPLIED = "applied"
    FINAL_ROUND = "final_round"
    OFFERED = "offered"
    RESOLVED = "resolved"
    STAGE_1 = "stage_1"
    STAGE_2 = "stage_2"
    STAGE_3_PLUS = "stage_3_plus"
    WILL_APPLY = "will_apply"


class ResolutionStatus(str, Enum):
    """Outcome state for a resolved application."""

    GHOSTED = "ghosted"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    ONGOING = "ongoing"  # still in flight
    ON_HOLD = "on_hold"
    REJECTED = "rejected"
