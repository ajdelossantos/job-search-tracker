"""Contacts resources."""

from typing import Annotated
from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from starlette import status
from app.data.database import SessionLocal

router = APIRouter(
  prefix="/api/v1/contacts",
  tags=["Contacts"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


@router.get("/", status_code=status.HTTP_200_OK)
async def read_contacts(db: db_dependency):
    return {"message": "Read contacts"}


@router.get("/{contact_id}", status_code=status.HTTP_200_OK)
async def read_contact(db: db_dependency, contact_id: int = Path(gt=0)):
    return {"message": f"Read contact {contact_id}"}


@router.patch("/{contact_id}", status_code=status.HTTP_200_OK)
async def update_contact(db: db_dependency, contact_id: int = Path(gt=0)):
    return {"message": f"Update contact {contact_id}"}


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(db: db_dependency, contact_id: int = Path(gt=0)):
    return {"message": f"Delete contact {contact_id}"}

