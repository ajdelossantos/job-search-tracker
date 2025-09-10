"""Tests for contact schemas."""

from datetime import datetime, timezone
from types import SimpleNamespace
import pytest
from pydantic import ValidationError
from app.schemas.contacts import ContactCreate, ContactUpdate, ContactRead


def test_contact_create_minimal_valid():
    """Test minimal valid contact creation."""
    m = ContactCreate(name="Jordan Quux", company="Acme")
    assert m.name == "Jordan Quux"
    assert m.company == "Acme"
    # default_factory list (not shared)
    assert m.application_ids == []


def test_contact_create_application_ids_accepts_list():
    """Test that application_ids accepts a list."""
    m = ContactCreate(name="A B C", company="Company", application_ids=[1, 2, 3])
    assert m.application_ids == [1, 2, 3]


def test_contact_create_invalid_email_raises():
    """Test that invalid email raises a validation error."""
    with pytest.raises(ValidationError):
        ContactCreate(name="Valid Name", company="Acme", email="not-an-email")


def test_contact_create_invalid_url_raises():
    """Test that invalid URL raises a validation error."""
    with pytest.raises(ValidationError):
        ContactCreate(
            name="Valid Name", company="Acme", url="linkedin.com/jordan"
        )  # no scheme


def test_contact_create_invalid_phone_raises():
    """Test that invalid phone raises a validation error."""
    with pytest.raises(ValidationError):
        ContactCreate(name="Valid Name", company="Acme", phone="lol-not-a-phone")


def test_contact_create_min_lengths_enforced():
    """Test that minimum length constraints are enforced."""
    with pytest.raises(ValidationError):
        ContactCreate(name="Jo", company="Acme")  # name too short
    with pytest.raises(ValidationError):
        ContactCreate(name="Jordan", company="AB")  # company too short
    with pytest.raises(ValidationError):
        ContactCreate(name="Jordan", company="Acme", title="Sr")  # title too short
    with pytest.raises(ValidationError):
        ContactCreate(name="Jordan", company="Acme", role="HR")  # role too short


def test_contact_update_partial_excludes_unset():
    """Test that partial updates exclude unset fields."""
    u = ContactUpdate(notes="ping later")
    d = u.model_dump(exclude_unset=True)
    assert d == {"notes": "ping later"}


def test_contact_update_lists_optional_and_can_be_empty():
    """Test that application_ids_add and application_ids_remove can be empty lists."""
    u = ContactUpdate(application_ids_add=[], application_ids_remove=[])
    assert u.application_ids_add == []
    assert u.application_ids_remove == []


def test_contact_update_min_lengths_enforced():
    """Test that minimum length constraints are enforced."""
    with pytest.raises(ValidationError):
        ContactUpdate(name="AB")
    with pytest.raises(ValidationError):
        ContactUpdate(company="XY")


def test_contact_read_computed_application_ids_and_excludes_raw_relation():
    """
    Test that ContactRead schema correctly computes application_ids from applications relation.

    Verifies that:
    - The computed application_ids property returns a list of application IDs
    - The model_dump() output includes the computed application_ids field
    - The raw applications relation is excluded from the serialized output
    """
    now = datetime.now(timezone.utc)
    # fake ORM objects with just an id
    apps = [SimpleNamespace(id=10), SimpleNamespace(id=20)]
    r = ContactRead(
        id=1,
        name="Jordan Quux",
        company="Acme",
        created_at=now,
        applications=apps,  # will be excluded from dump
    )
    assert r.application_ids == [10, 20]

    dumped = r.model_dump()
    # computed field should appear
    assert dumped["application_ids"] == [10, 20]
    # raw relation should be excluded
    assert "applications" not in dumped


def test_contact_read_list_default_not_shared():
    """Test that the applications relation list is not shared between instances."""
    now = datetime.now(timezone.utc)
    r1 = ContactRead(id=1, name="A" * 3, company="B" * 3, created_at=now)
    r2 = ContactRead(id=2, name="C" * 3, company="D" * 3, created_at=now)
    # mutate r1's internal relation list
    r1.applications.append(SimpleNamespace(id=99))
    assert r1.application_ids == [99]
    assert r2.application_ids == []  # proves default_factory isolated instances
