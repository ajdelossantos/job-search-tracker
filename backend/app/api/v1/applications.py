"""Applications resources."""

from typing import Annotated
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from starlette import status
from app.data.database import SessionLocal

router = APIRouter(
  prefix="/api/v1/applications",
  tags=["Applications"]
)

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]


@router.get("/", status_code=status.HTTP_200_OK)
async def read_applications(db: db_dependency):
    return {"message": "Read applications"}


@router.get("/{application_id}", status_code=status.HTTP_200_OK)
async def read_application(db: db_dependency, application_id: int = Path(gt=0)):
    return {"message": f"Read application {application_id}"}


@router.patch("/{application_id}", status_code=status.HTTP_200_OK)
async def update_application(db: db_dependency, application_id: int = Path(gt=0)):
    return {"message": f"Update application {application_id}"}


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(db: db_dependency, application_id: int = Path(gt=0)):
    return {"message": f"Delete application {application_id}"}

