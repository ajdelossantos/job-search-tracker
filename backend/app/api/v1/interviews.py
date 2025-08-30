"""Interviews resources."""

from typing import Annotated
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from starlette import status
from app.data.database import SessionLocal

router = APIRouter(
  prefix="/api/v1/interviews",
  tags=["Interviews"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


@router.get("/", status_code=status.HTTP_200_OK)
async def read_interviews(db: db_dependency):
    return {"message": "Read interviews"}

@router.get("/{interview_id}", status_code=status.HTTP_200_OK)
async def read_interview(db: db_dependency, interview_id: int = Path(gt=0)):
    return {"message": f"Read interview {interview_id}"}


@router.patch("/{interview_id}", status_code=status.HTTP_200_OK)
async def update_interview(db: db_dependency, interview_id: int = Path(gt=0)):
    return {"message": f"Update interview {interview_id}"}


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(db: db_dependency, interview_id: int = Path(gt=0)):
    return {"message": f"Delete interview {interview_id}"}