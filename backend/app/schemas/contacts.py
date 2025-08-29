"""Pydantic models for contacts."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, HttpUrl
from pydantic_extra_types.phone_numbers import PhoneNumber


class ContactBase(BaseModel):
    """Base for Contact model."""
    name: str
    company: str
    email: Optional[EmailStr] = None
    title: Optional[str] = None
    url: Optional[HttpUrl] = None
    role: Optional[str] = None
    phone: Optional[PhoneNumber] = None
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    """Schema for creating a new contact."""
    pass

class ContactUpdate(ContactBase):
    """Schema for updating an existing contact."""
    pass

class Contact(ContactBase):
    """Represents a contact entity with its associated attributes."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    applications: list[int]
