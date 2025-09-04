"""Pydantic models for contacts."""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field, EmailStr, HttpUrl, computed_field
from pydantic_extra_types.phone_numbers import PhoneNumber


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
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "Jordan Quux",
            "company": "Acme",
            "email": "jordan@acme.com",
            "title": "Recruiter",
            "url": "https://linkedin.com/in/jordan",
            "role": "Recruiter",
            "phone": "+15125551234",
            "notes": "Follow up in a week",
        }
    })

    application_ids: List[int] = Field(default_factory=list)

class ContactUpdate(ContactBase):
    """Schema for updating an existing contact."""

    name: Optional[str] = Field(None, min_length=3)
    company: Optional[str] = Field(None, min_length=3)
    application_ids_add: Optional[List[int]] = None
    application_ids_remove: Optional[List[int]] = None


class ContactRead(ContactBase):
    """Represents a contact entity with its associated attributes."""
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
