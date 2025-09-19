"""Pydantic models for contacts."""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    EmailStr,
    HttpUrl,
    computed_field,
    field_serializer,
)
from pydantic_extra_types.phone_numbers import PhoneNumber
from app.core.timeutils import to_z


class ContactBase(BaseModel):
    """Base for Contact model."""

    name: str = Field(min_length=3)
    company: str = Field(min_length=3)
    email: Optional[EmailStr] = None
    title: Optional[str] = Field(None, min_length=3)
    url: Optional[HttpUrl] = None
    role: Optional[str] = Field(None, min_length=3)
    phone: Optional[PhoneNumber] = None
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    """Schema for creating a new contact."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Jordan Quux",
                "company": "Acme",
                "email": "jordan@acme.com",
                "title": "Recruiter",
                "url": "https://linkedin.com/in/jordan",
                "role": "Recruiter",
                "phone": "+15125551234",
                "notes": "Follow up in a week",
                "application_ids": [],
            }
        }
    )

    application_ids: List[int] = Field(default_factory=list)


class ContactUpdate(ContactBase):
    """Schema for updating an existing contact. Phone accepts E.164 and RFC 3966 formats."""

    name: Optional[str] = Field(None, min_length=3)
    company: Optional[str] = Field(None, min_length=3)
    application_ids_add: Optional[List[int]] = None
    application_ids_remove: Optional[List[int]] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "name": "Jordan Quux",
                "company": "Acme",
                "email": "jordan@acme.com",
                "title": "Recruiter",
                "url": "https://linkedin.com/in/jordan",
                "role": "Recruiter",
                "phone": "+15125551234",
                "notes": "Follow up in a week",
                "application_ids_add": [3],
                "application_ids_remove": [1],
            }
        },
    )


class ContactRead(ContactBase):
    """Represents a contact entity with its associated attributes. Phone will always return RFC 3966 format."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "created_at": "2023-10-01T12:34:56Z",
                "updated_at": "2023-10-02T12:34:56Z",
                "name": "Jordan Quux",
                "company": "Acme",
                "email": "jordan@acme.com",
                "title": "Recruiter",
                "url": "https://linkedin.com/in/jordan",
                "role": "Recruiter",
                "phone": "tel:+1-512-555-1234",
                "notes": "Follow up in a week",
            }
        },
    )

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Bring the ORM relation in, but exclude it from output
    applications: List[Any] = Field(default_factory=list, exclude=True)

    @computed_field(return_type=List[int])
    @property
    def application_ids(self) -> List[int]:
        """Serializes applications ids."""
        return [a.id for a in (self.applications or [])]

    @field_serializer("created_at", when_used="json")
    def _s_created(self, v: datetime, _info):
        return to_z(v)

    @field_serializer("updated_at", when_used="json")
    def _s_updated(self, v: Optional[datetime], _info):
        return to_z(v)
