# app/api/v1/interviews.py
"""Interviews resources."""

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session
from starlette import status

from app.data.database import SessionLocal
from app.models.models import Applications, Interviews
from app.schemas.interviews import (
    InterviewCreate,
    InterviewRead,
    InterviewUpdate,
    InterviewCreateFlat,
)
from app.services.interviews_service import ensure_aware_utc

router = APIRouter(prefix="/api/v1", tags=["Interviews"])


def get_db():
    """Get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


# ---------- Nested: /applications/{application_id}/interviews ----------


@router.get(
    "/applications/{application_id}/interviews",
    response_model=List[InterviewRead],
    status_code=status.HTTP_200_OK,
    summary="List interviews for an application (nested)",
    description=(
        "Preferred way to fetch interviews scoped to a single application.\n\n"
        "**Use this when you already know the `application_id`.**\n\n"
        "Example:\n"
        "```\n"
        "GET /api/v1/applications/42/interviews\n"
        "```\n"
        "Query params: `limit`, `offset`."
    ),
)
async def list_interviews_for_application(
    db: db_dependency,
    application_id: int = Path(gt=0),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List interviews scoped to an application."""
    if db.get(Applications, application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")

    query = (
        db.query(Interviews)
        .filter(Interviews.application_id == application_id)
        .order_by(Interviews.scheduled_date.asc())
        .limit(limit)
        .offset(offset)
    )

    application_interviews = query.all()

    return [ensure_aware_utc(i) for i in application_interviews]


@router.post(
    "/applications/{application_id}/interviews",
    response_model=InterviewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an interview under an application (nested)",
    description=(
        "Creates an interview for a specific application.\n\n"
        "**Preferred over flat POST** because the parent is explicit in the path.\n\n"
        "Example body:\n"
        "```json\n"
        "{\n"
        '  "scheduled_date": "2025-09-05T19:00:00Z",\n'
        '  "type": "recruiter",\n'
        '  "notes": "Recruiter screen"\n'
        "}\n"
        "```"
    ),
)
async def create_interview_for_application(
    db: db_dependency,
    application_id: int = Path(gt=0),
    payload: InterviewCreate = ...,
    response: Response = ...,
):
    """Create an interview under an application."""
    application = db.get(Applications, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    # Dedup application_id
    data = payload.model_dump()
    data.pop("application_id", None)

    new_interview = Interviews(application_id=application_id, **data)
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    response.headers["Location"] = f"/api/v1/interviews/{new_interview.id}"

    return ensure_aware_utc(new_interview)


# ---------- Flat: /interviews (kept for convenience) ----------


@router.get(
    "/interviews",
    response_model=List[InterviewRead],
    status_code=status.HTTP_200_OK,
    summary="List interviews (flat)",
    description=(
        "Lists interviews across applications.\n\n"
        "Optional filter: `?application_id=42`.\n\n"
        "**Tip:** If you’re already scoped to an application, prefer the nested endpoint."
    ),
)
async def list_interviews(
    db: db_dependency,
    application_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List interviews (optionally filter by application_id)."""
    query = db.query(Interviews)

    if application_id:
        query = query.filter(Interviews.application_id == application_id)

    interviews = (
        query.order_by(Interviews.scheduled_date.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return [ensure_aware_utc(i) for i in interviews]


@router.get(
    "/interviews/{interview_id}",
    response_model=InterviewRead,
    status_code=status.HTTP_200_OK,
    summary="Get an interview by ID",
    description="Fetch a single interview by ID.",
)
async def read_interview(db: db_dependency, interview_id: int = Path(gt=0)):
    """Read a single interview by ID."""
    interview = db.get(Interviews, interview_id)

    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")

    return ensure_aware_utc(interview)


# Optional: keep a flat POST that accepts application_id in body
@router.post(
    "/interviews",
    response_model=InterviewRead,
    status_code=status.HTTP_201_CREATED,
    description=(
        "Creates an interview when passing `application_id` in the request body.\n\n"
        "**Tip:** Prefer the nested endpoint when possible.**\n\n"
        "Example body:\n"
        "```json\n"
        "{\n"
        '  "application_id": 42,\n'
        '  "scheduled_date": "2025-09-05T19:00:00Z",\n'
        '  "type": "recruiter",\n'
        '  "notes": "Recruiter screen"\n'
        "}\n"
        "```"
    ),
)
async def create_interview_flat(
    db: db_dependency, payload: InterviewCreateFlat, response: Response
):
    """Create a new interview with no parent application."""
    data = payload.model_dump()
    application_id = data.pop("application_id")
    application = db.get(Applications, application_id)

    if application is None:
        raise HTTPException(
            status_code=400,
            detail=f"application_id {payload.application_id} does not exist",
        )

    new_interview = Interviews(application_id=application_id, **data)
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    response.headers["Location"] = f"/api/v1/interviews/{new_interview.id}"
    return ensure_aware_utc(new_interview)


@router.patch(
    "/interviews/{interview_id}",
    response_model=InterviewRead,
    status_code=status.HTTP_200_OK,
    summary="Update an interview",
    description=(
        "Partial update. `scheduled_date` must be timezone-aware if provided. "
        "`application_id` reassignment is not supported here."
    ),
)
async def update_interview(
    db: db_dependency,
    interview_id: int = Path(gt=0),
    payload: InterviewUpdate = ...,
):
    """Update an interview."""
    interview = db.get(Interviews, interview_id)

    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")

    data = payload.model_dump(exclude_unset=True)
    # Protect application_id from update
    data.pop("application_id", None)

    for k, v in data.items():
        setattr(interview, k, v)

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return ensure_aware_utc(interview)


@router.delete(
    "/interviews/{interview_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an interview",
    description="Deletes an interview by ID.",
)
async def delete_interview(db: db_dependency, interview_id: int = Path(gt=0)):
    """Delete an interview by ID."""
    interview = db.get(Interviews, interview_id)
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    db.delete(interview)
    db.commit()
