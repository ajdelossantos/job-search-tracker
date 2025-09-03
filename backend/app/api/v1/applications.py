"""Applications resources."""

from typing import Annotated
from fastapi import APIRouter, Depends, Path, HTTPException, Query, Response
from sqlalchemy.orm import Session, selectinload
from starlette import status
from app.data.database import SessionLocal
from app.models.models import Applications
from app.schemas.applications import ApplicationCreate, ApplicationUpdate, ApplicationRead

router = APIRouter(
  prefix="/api/v1/applications",
  tags=["Applications"]
)

def get_db():
    """Get a database session."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


@router.get("/", status_code=status.HTTP_200_OK)
async def read_applications(
    db: db_dependency,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
  ):
    """Read all applications."""
    query = db.query(Applications)\
            .options(
                selectinload(Applications.interviews),
                selectinload(Applications.contacts),
                selectinload(Applications.pipeline_histories)
            )
    items = query.order_by(Applications.created_at.desc()).limit(limit).offset(offset).all()

    return items


@router.get("/{application_id}", response_model=ApplicationRead, status_code=status.HTTP_200_OK)
async def read_application(db: db_dependency, application_id: int = Path(gt=0)):
    """Read a single application by ID."""
    application_model = db.query(Applications)\
                        .options(
                            selectinload(Applications.interviews),
                            selectinload(Applications.contacts),
                            selectinload(Applications.pipeline_histories)
                        )\
                        .filter(Applications.id == application_id).first()

    if application_model is None:
        raise HTTPException(status_code=404, detail="Application not found")

    return application_model


@router.post("/", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(db: db_dependency, payload: ApplicationCreate, response: Response):
    """Create a new application."""
    new_application = Applications(**payload.model_dump())
    if new_application.url is not None:
        new_application.url = str(new_application.url)
    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    response.headers["Location"] = f"/api/v1/applications/{new_application.id}"

    app_full = db.get(
        Applications,
        new_application.id,
        options=(
            selectinload(Applications.interviews),
            selectinload(Applications.contacts),
            selectinload(Applications.pipeline_histories),
        ),
    )

    return app_full


@router.patch(
    "/{application_id}", response_model=ApplicationRead, status_code=status.HTTP_200_OK
)
async def update_application(
    db: db_dependency,
    payload: ApplicationUpdate,
    application_id: int = Path(gt=0)
  ):
    """Update an existing application."""
    application_model = db.query(Applications).filter(Applications.id == application_id).first()

    if application_model is None:
        raise HTTPException(status_code=404, detail="Application not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(application_model, k, v)

    db.add(application_model)
    db.commit()
    db.refresh(application_model)

    return application_model


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(db: db_dependency, application_id: int = Path(gt=0)):
    """Delete an application by ID."""
    application_model = db.query(Applications).filter(Applications.id == application_id).first()

    if application_model is None:
        raise HTTPException(status_code=404, detail="Application not found")

    db.query(Applications).filter(Applications.id == application_id).delete()
    db.commit()
