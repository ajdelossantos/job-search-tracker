"""Contacts resources."""

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session, selectinload
from starlette import status
from app.data.database import SessionLocal
from app.models.models import Contacts, Applications
from app.schemas.contacts import ContactRead, ContactCreate, ContactUpdate

router = APIRouter(
  prefix="/api/v1/contacts",
  tags=["Contacts"]
)


def get_db():
    """Get a database session."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


@router.get("/", response_model=List[ContactRead], status_code=status.HTTP_200_OK)
async def read_contacts(
    db: db_dependency,
    limit: int = Query(10, ge=1, le=200),
    offset: int = Query(0, ge=0),
    name: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    application_id: Optional[int] = Query(None)
):
    """Read all contacts."""
    query = db.query(Contacts).options(selectinload(Contacts.applications))

    if name:
        query = query.filter(Contacts.name.ilike(f"%{name}%"))
    if company:
        query = query.filter(Contacts.company.ilike(f"%{company}%"))
    if application_id:
        query = (
            query.join(Contacts.applications)
              .filter(Applications.id == application_id)
              .distinct()
        )

    return query.order_by(Contacts.created_at.desc()).limit(limit).offset(offset).all()


@router.get("/{contact_id}", response_model=ContactRead, status_code=status.HTTP_200_OK)
async def read_contact(db: db_dependency, contact_id: int = Path(gt=0)):
    """Read a contact by ID."""
    contact_model = (
        db.query(Contacts)
        .options(selectinload(Contacts.applications))
        .filter(Contacts.id == contact_id)
        .first()
    )
    if not contact_model:
        raise HTTPException(status_code=404, detail="Contact not found")

    return contact_model


@router.post("/", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact(db: db_dependency, payload: ContactCreate, response: Response):
    """Create a new contact."""
    data = payload.model_dump()
    application_ids = data.pop("application_ids", [])

    # coerce to strings for DB-safe columns
    if data.get("url"):
        data["url"] = str(data["url"])
    if data.get("phone"):
        data["phone"] = str(data["phone"])
    if data.get("email"):
        data["email"] = str(data["email"])

    contact_model = Contacts(**data)

    if application_ids:
        applications = db.query(Applications).filter(Applications.id.in_(application_ids)).all()
        missing = set(application_ids) - {a.id for a in applications}
        if missing:
            raise HTTPException(
                status_code=400, detail=f"Invalid application_ids: {sorted(missing)}"
            )
        contact_model.applications.extend(applications)

    db.add(contact_model)
    db.commit()

    # load with relation for computed application_ids
    created = db.get(
        Contacts,
        contact_model.id,
        options=(selectinload(Contacts.applications),),
    )

    response.headers["Location"] = f"/api/v1/contacts/{created.id}"
    return created


@router.patch("/{contact_id}", response_model=ContactRead, status_code=status.HTTP_200_OK)
async def update_contact(db: db_dependency, payload: ContactUpdate, contact_id: int = Path(gt=0)):
    """Update a contact by ID."""
    contact_model = (
        db.query(Contacts)
          .options(selectinload(Contacts.applications))
          .filter(Contacts.id == contact_id)
          .first()
    )

    if contact_model is None:
        raise HTTPException(status_code=404, detail="Contact not found")

    data = payload.model_dump(exclude_unset=True)

    ids_add = data.pop("application_ids_add", None)
    ids_remove = data.pop("application_ids_remove", None)

    if "url" in data and data["url"] is not None:
        data["url"] = str(data["url"])
    if "phone" in data and data["phone"] is not None:
        data["phone"] = str(data["phone"])
    if "email" in data and data["email"] is not None:
        data["email"] = str(data["email"])
    for k, v in data.items():
        setattr(contact_model, k, v)

    # add links
    if ids_add:
        apps = db.query(Applications).filter(Applications.id.in_(ids_add)).all()
        missing = set(ids_add) - {a.id for a in apps}
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid application_ids_add: {sorted(missing)}",
            )
        existing = {a.id for a in contact_model.applications}
        for a in apps:
            if a.id not in existing:
                contact_model.applications.append(a)

    # remove links
    if ids_remove:
        # optional: validate they exist; harmless to skip
        remove_set = set(ids_remove)
        contact_model.applications = [
            a for a in contact_model.applications if a.id not in remove_set
        ]

    db.add(contact_model)
    db.commit()

    # return with relation loaded so application_ids is computed
    return db.get(
        Contacts,
        contact_id,
        options=(selectinload(Contacts.applications),),
    )


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(db: db_dependency, contact_id: int = Path(gt=0)):
    """Delete a contact by ID."""
    contact_model = db.query(Contacts).filter(Contacts.id == contact_id).first()

    if contact_model is None:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact_model)
    db.commit()
