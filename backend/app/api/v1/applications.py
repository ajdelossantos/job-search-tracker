"""Applications resources."""

from typing import Annotated
from fastapi import APIRouter, Depends, Path, HTTPException, Query, Response
from sqlalchemy.orm import Session, selectinload
from starlette import status
from app.data.database import SessionLocal
from app.models.models import Applications
from app.schemas.applications import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationRead,
)
from app.services.applications_service import (
    create_application_with_history,
    delete_application_and_history,
    update_application_with_history,
    normalize_nested_interviews,
)

router = APIRouter(prefix="/api/v1/applications", tags=["Applications"])


def get_db():  # pragma: no cover
    """Get a database session."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="List applications",
    description="Returns applications with interviews, contacts, and pipeline history preloaded.",
)
async def read_applications(
    db: db_dependency,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Read all applications."""
    query = db.query(Applications).options(
        selectinload(Applications.interviews),
        selectinload(Applications.contacts),
        selectinload(Applications.pipeline_histories),
    )
    items = (
        query.order_by(Applications.created_at.desc()).limit(limit).offset(offset).all()
    )

    for app in items:
        normalize_nested_interviews(app)

    return items


@router.get(
    "/{application_id}",
    response_model=ApplicationRead,
    status_code=status.HTTP_200_OK,
    summary="Get an application by id",
    description="Returns one application with interviews, contacts, and pipeline history.",
)
async def read_application(db: db_dependency, application_id: int = Path(gt=0)):
    """Read a single application by ID."""
    application_model = (
        db.query(Applications)
        .options(
            selectinload(Applications.interviews),
            selectinload(Applications.contacts),
            selectinload(Applications.pipeline_histories),
        )
        .filter(Applications.id == application_id)
        .first()
    )

    if application_model is None:
        raise HTTPException(status_code=404, detail="Application not found")

    return normalize_nested_interviews(application_model)


@router.post(
    "/",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an application",
    description=(
        "Creates a new application and automatically logs an initial pipeline history entry "
        "(`None → pipeline_status`)."
    ),
)
async def create_application(
    db: db_dependency, payload: ApplicationCreate, response: Response
):
    """Create a new application."""
    application_full = create_application_with_history(db, payload)

    response.headers["Location"] = f"/api/v1/applications/{application_full.id}"

    return application_full


@router.patch(
    "/{application_id}",
    response_model=ApplicationRead,
    status_code=status.HTTP_200_OK,
    summary="Update an application",
    description=(
        "Updates fields on an application. If `pipeline_status` changes, a PipelineHistory "
        "entry is automatically appended (`from_status → to_status`)."
    ),
)
async def update_application(
    db: db_dependency, payload: ApplicationUpdate, application_id: int = Path(gt=0)
):
    """Update an existing application."""
    updated_application = update_application_with_history(db, application_id, payload)

    if updated_application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    return updated_application


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an application",
    description="Deletes the application; associated PipelineHistory, Interviews, and links are removed via cascade.",
)
async def delete_application(db: db_dependency, application_id: int = Path(gt=0)):
    """Delete an application by ID."""
    ok = delete_application_and_history(db, application_id)

    if not ok:
        raise HTTPException(status_code=404, detail="Application not found")
