"""Tests for contact schemas."""
from datetime import datetime, timezone
from app.schemas.contacts import ContactCreate, ContactUpdate, ContactRead


def test_contact_create_valid():
    """Test valid contact creation."""
    c = ContactCreate(
        name="Jordan Lee",
        company="Acme",
        email="jordan@acme.com",
        title="Recruiter",
        url="https://acme.com/jordan",
        role="recruiter",
        phone="+15125551212",
        notes="Prefers morning calls",
    )
    assert c.name == "Jordan Lee"
    assert str(c.url) == "https://acme.com/jordan"


def test_contact_update_partial():
    """Test partial contact update."""
    u = ContactUpdate(notes="Updated")
    assert u.model_dump(exclude_unset=True) == {"notes": "Updated"}


def test_contact_read_computed_application_ids():
    """Test computed application IDs."""
    # Minimal dict; application_ids computed -> []
    r = ContactRead(
        id=1,
        created_at=datetime.now(timezone.utc),
        name="Jordan",
        company="Acme",
    )
    assert r.application_ids == []
