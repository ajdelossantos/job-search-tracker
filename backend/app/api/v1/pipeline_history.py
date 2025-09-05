"""Pipeline history resources."""

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Path, Query, HTTPException, Response
from sqlalchemy.orm import Session
from starlette import status
from app.data.database import SessionLocal
from app.models.models import Applications, PipelineHistory
from app.schemas.pipeline_history import (
    PipelineHistoryRead,
    PipelineHistoryCreate,
    PipelineHistoryCreateFlat,
    PipelineHistoryUpdate,
)

router = APIRouter(prefix="/api/v1", tags=["PipelineHistory"])


def get_db():
    """Dependency to get DB session."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


# ---------- Nested: /applications/{application_id}/pipeline-history----------


@router.get(
    "/applications/{application_id}/pipeline-history",
    response_model=List[PipelineHistoryRead],
    status_code=status.HTTP_200_OK,
    summary="List pipeline history for an application",
    description=(
        "Returns the pipeline history entries for an application, ordered by "
        "`changed_at` descending (most recent first)."
    ),
)
async def list_pipeline_history_for_application(
    db: db_dependency,
    application_id: int = Path(gt=0),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List pipeline history entries for a specific application."""
    # Ensure the parent application exists
    if db.get(Applications, application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")

    query = (
        db.query(PipelineHistory)
        .filter(PipelineHistory.application_id == application_id)
        .order_by(PipelineHistory.changed_at.desc(), PipelineHistory.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return query.all()


@router.post(
    "/applications/{application_id}/pipeline-history",
    response_model=PipelineHistoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create pipeline history under an application",
    description=(
        "Creates a new pipeline history entry for the specified application. "
        "`from_status` may be omitted for initial transitions. "
        "Use this nested endpoint for typical client flows."
    ),
)
async def create_pipeline_history_for_application(
    db: db_dependency,
    application_id: int = Path(gt=0),
    payload: PipelineHistoryUpdate | PipelineHistoryCreate = ...,
    response: Response = ...,
):
    """Create a pipeline history entry under an application."""
    # Validate application exists
    application = db.get(Applications, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    # Accept the same shape as PipelineHistoryBase for nested POST (no body application_id).
    # If someone sends the flat shape, ignore its application_id and use path one.
    data = payload.model_dump(exclude_unset=True)
    data.pop("application_id", None)

    if "to_status" not in data:
        # Enforce required to_status here for nested path (since we accept Union type above)
        raise HTTPException(status_code=400, detail="Field 'to_status' is required.")

    new_pipeline_history = PipelineHistory(application_id=application_id, **data)
    db.add(new_pipeline_history)
    db.commit()
    db.refresh(new_pipeline_history)

    response.headers["Location"] = f"/api/v1/pipeline-history/{new_pipeline_history.id}"
    return new_pipeline_history


# ---------- Flat: /pipeline-history (kept for convenience) ----------


@router.get(
    "/pipeline-history",
    response_model=List[PipelineHistoryRead],
    status_code=status.HTTP_200_OK,
    summary="List pipeline history (optionally filter by application_id)",
    description=(
        "Returns pipeline history entries across all applications. "
        "Use `application_id` query param to filter. Results are ordered by "
        "`changed_at` descending (most recent first)."
    ),
)
async def read_pipeline_histories(
    db: db_dependency,
    application_id: Optional[int] = Query(
        None, description="Filter by application id."
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Read pipeline history entries, optionally filtered by application_id."""
    query = db.query(PipelineHistory)

    if application_id:
        query = query.filter(PipelineHistory.application_id == application_id)

    pipeline_histories = (
        query.order_by(
            PipelineHistory.changed_at.desc(),
            PipelineHistory.id.desc(),
        )
        .limit(limit)
        .offset(offset)
        .all()
    )

    return pipeline_histories


@router.get(
    "/pipeline-history/{history_id}",
    response_model=PipelineHistoryRead,
    status_code=status.HTTP_200_OK,
    summary="Get a pipeline history record by id",
)
async def read_pipeline_history(
    db: db_dependency,
    history_id: int = Path(gt=0),
):
    """Get a pipeline history record by id."""
    pipeline_history = db.get(PipelineHistory, history_id)

    if pipeline_history is None:
        raise HTTPException(status_code=404, detail="Pipeline history not found")

    return pipeline_history


@router.post(
    "/pipeline-history",
    response_model=PipelineHistoryRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create pipeline history (flat)",
    description=(
        "Creates a pipeline history entry using a request body with `application_id`. "
        "If you already know the application context, prefer the nested POST."
    ),
)
async def create_pipeline_history(
    db: db_dependency,
    payload: PipelineHistoryCreateFlat,
):
    """Create a pipeline history entry (flat)."""
    # Ensure application exists
    application = db.get(Applications, payload.application_id)
    if application is None:
        raise HTTPException(
            status_code=404,
            detail=f"application_id {payload.application_id} does not exist",
        )

    new_history = PipelineHistory(
        application_id=payload.application_id,
        from_status=payload.from_status,
        to_status=payload.to_status,
        note=payload.note,
    )
    db.add(new_history)
    db.commit()
    db.refresh(new_history)

    return new_history


@router.patch(
    "/pipeline-history/{history_id}",
    response_model=PipelineHistoryRead,
    status_code=status.HTTP_200_OK,
    summary="Update a pipeline history note",
    description="Only the `note` field may be updated. Status fields are ignored.",
)
async def update_pipeline_history(
    db: db_dependency,
    history_id: int = Path(gt=0),
    payload: PipelineHistoryUpdate = ...,
):
    """Update a pipeline history note; extra fields are rejected (422)."""
    pipeline_history = db.get(PipelineHistory, history_id)

    if pipeline_history is None:
        raise HTTPException(status_code=404, detail="Pipeline history not found")

    # Only note can be updated
    data = payload.model_dump(exclude_unset=True)
    # Explicitly ignore attempts to change statuses/application link
    data.pop("from_status", None)
    data.pop("to_status", None)
    data.pop("application_id", None)

    for k, v in data.items():
        setattr(pipeline_history, k, v)

    db.add(pipeline_history)
    db.commit()
    db.refresh(pipeline_history)

    return pipeline_history


@router.delete(
    "/pipeline-history/{history_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a pipeline history record",
)
async def delete_pipeline_history(
    db: db_dependency,
    history_id: int = Path(gt=0),
):
    """Delete a pipeline history record by id."""
    pipeline_history = db.get(PipelineHistory, history_id)
    if pipeline_history is None:
        raise HTTPException(status_code=404, detail="Pipeline history not found")

    db.delete(pipeline_history)
    db.commit()
