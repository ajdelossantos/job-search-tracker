"""Tests for Interviews endpoint (nested + flat)."""

from datetime import datetime, timedelta, timezone
from fastapi import status

from app.core.enums import InterviewType


def _iso_utc(dt: datetime) -> str:
    """Return an RFC3339-ish string with Z."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def _new_interview_payload(scheduled_dt: datetime | None = None):
    return {
        "scheduled_date": _iso_utc(
            scheduled_dt or datetime.now(timezone.utc) + timedelta(days=1)
        ),
        "type": InterviewType.RECRUITER.value,
        "notes": "Recruiter call",
    }


def test_create_interview_under_application_returns_read(client, make_application):
    """Test creating an interview under a specific application."""
    app_obj = make_application(company="Nested Co")
    payload = _new_interview_payload()
    r = client.post(f"/api/v1/applications/{app_obj.id}/interviews", json=payload)
    assert r.status_code == status.HTTP_201_CREATED, r.text
    body = r.json()
    assert body["application_id"] == app_obj.id
    assert body["type"] == InterviewType.RECRUITER.value
    # tz-aware echo
    assert body["scheduled_date"].endswith("Z")


def test_get_interview_by_id(client, make_application):
    """Test retrieving an interview by its ID."""
    app_obj = make_application(company="Get Co")
    payload = _new_interview_payload()
    created = client.post(
        f"/api/v1/applications/{app_obj.id}/interviews", json=payload
    ).json()
    r = client.get(f"/api/v1/interviews/{created['id']}")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["id"] == created["id"]


def test_list_interviews_by_application_nested_and_flat(client, make_application):
    """Test listing interviews by application (nested + flat)."""
    app_obj = make_application(company="List Co")

    t1 = datetime.now(timezone.utc) + timedelta(days=1)
    t2 = t1 + timedelta(hours=2)

    client.post(
        f"/api/v1/applications/{app_obj.id}/interviews",
        json=_new_interview_payload(t1),
    )
    client.post(
        f"/api/v1/applications/{app_obj.id}/interviews",
        json=_new_interview_payload(t2),
    )

    # Nested list
    r_nested = client.get(f"/api/v1/applications/{app_obj.id}/interviews")
    assert r_nested.status_code == status.HTTP_200_OK
    nested = r_nested.json()
    assert len(nested) == 2
    # should be ascending by scheduled_date
    assert nested[0]["scheduled_date"] <= nested[1]["scheduled_date"]

    # Flat list with filter
    r_flat = client.get(f"/api/v1/interviews?application_id={app_obj.id}")
    assert r_flat.status_code == status.HTTP_200_OK
    assert len(r_flat.json()) == 2


def test_patch_interview_updates_fields(client, make_application):
    """Test updating an interview's fields."""
    app_obj = make_application(company="Patch Co")
    created = client.post(
        f"/api/v1/applications/{app_obj.id}/interviews",
        json=_new_interview_payload(),
    ).json()

    new_dt = datetime.now(timezone.utc) + timedelta(days=3)
    r = client.patch(
        f"/api/v1/interviews/{created['id']}",
        json={
            "scheduled_date": _iso_utc(new_dt),
            "type": InterviewType.TECHNICAL.value,
            "notes": "Pairing session",
            # try to reassign app (ignored by router)
            "application_id": 999999,
        },
    )
    assert r.status_code == status.HTTP_200_OK, r.text
    body = r.json()
    assert body["application_id"] == app_obj.id  # unchanged
    assert body["type"] == InterviewType.TECHNICAL.value
    assert body["notes"] == "Pairing session"
    assert body["scheduled_date"].endswith("Z")


def test_delete_interview_then_404_on_get(client, make_application):
    """Test deleting an interview then getting it returns 404."""
    app_obj = make_application(company="Delete Co")
    created = client.post(
        f"/api/v1/applications/{app_obj.id}/interviews",
        json=_new_interview_payload(),
    ).json()
    r_del = client.delete(f"/api/v1/interviews/{created['id']}")
    assert r_del.status_code == status.HTTP_204_NO_CONTENT
    r_get = client.get(f"/api/v1/interviews/{created['id']}")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND


def test_flat_post_still_works_if_enabled(client, make_application):
    """Test creating an interview with flat POST if enabled."""
    app_obj = make_application(company="Flat Co")
    payload = _new_interview_payload()
    payload["application_id"] = app_obj.id
    r = client.post("/api/v1/interviews", json=payload)
    assert r.status_code in (status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND), r.text
    # If the flat POST is enabled, we get 201; if disabled later, a 404 is fine.
    if r.status_code == status.HTTP_201_CREATED:
        assert r.json()["application_id"] == app_obj.id


def test_rejects_naive_datetime(client, make_application):
    """Test rejecting naive datetime for interview scheduling."""
    app_obj = make_application(company="Naive Co")
    naive = datetime.utcnow()  # intentionally naive
    payload = {
        "scheduled_date": naive.isoformat(),  # no Z/no tzinfo → should fail validation
        "type": InterviewType.RECRUITER.value,
        "notes": "naive dt",
    }
    r = client.post(f"/api/v1/applications/{app_obj.id}/interviews", json=payload)
    assert r.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    # helpful message from model validator
    assert (
        "timezone-aware" in r.text or "scheduled_date must be timezone-aware" in r.text
    )
