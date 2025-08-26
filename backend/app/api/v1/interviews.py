"""Interviews resources."""

from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from starlette import status
from ...data.database import SessionLocal

router = APIRouter(
  prefix="/api/v1/interviews",
  tags=["interviews"]
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
