"""Tests for the Applications API. Happy-path testing for now in dev."""

from datetime import date
from fastapi import status
from app.core.enums import JobLocation, PipelineStatus, ResolutionStatus


def _new_payload(company: str = "Acme Corp"):
    return {
        "date_applied": str(date.today()),
        "company": company,
        "role": "Senior Frontend Engineer",
        "url": "https://example.com/jobs/123",
        "salary_min": 150000,
        "salary_max": 190000,
        "salary_target": 180000,
        "job_location": JobLocation.REMOTE.value,
        "pipeline_status": PipelineStatus.WILL_APPLY.value,
        "resolution_status": ResolutionStatus.ONGOING.value,
        "notes": "Initial prospect",
    }


def test_create_application_returns_full_read(client):
    """Tests creating an application returns the full read object."""
    r = client.post("/api/v1/applications/", json=_new_payload())
    assert r.status_code == status.HTTP_201_CREATED, r.text
    body = r.json()

    assert isinstance(body["id"], int) and body["id"] > 0
    assert body["company"] == "Acme Corp"
    assert body["url"] == "https://example.com/jobs/123"
    assert body["pipeline_status"] == PipelineStatus.WILL_APPLY.value
    assert body["resolution_status"] == ResolutionStatus.ONGOING.value

    # nested arrays should be present; pipeline_histories now has an initial row
    assert body["interviews"] == []
    assert body["contacts"] == []
    ph = body.get("pipeline_histories", [])
    assert isinstance(ph, list) and len(ph) == 1
    assert ph[0]["from_status"] is None
    assert ph[0]["to_status"] == PipelineStatus.WILL_APPLY.value


def test_get_application_by_id(client, make_application):
    """Tests retrieving an application by ID."""
    created = make_application(company="Beta LLC")
    r = client.get(f"/api/v1/applications/{created.id}")

    assert r.status_code == status.HTTP_200_OK
    assert r.json()["id"] == created.id
    assert r.json()["company"] == "Beta LLC"


def test_list_applications_with_pagination(client, make_application):
    """Tests listing applications with pagination."""
    # seed two
    make_application(company="Alpha Inc")
    make_application(company="Gamma Ltd")

    r = client.get("/api/v1/applications/?limit=1&offset=0")
    assert r.status_code == status.HTTP_200_OK
    assert isinstance(r.json(), list) and len(r.json()) == 1

    r2 = client.get("/api/v1/applications/?limit=2&offset=0")
    assert r2.status_code == status.HTTP_200_OK
    assert len(r2.json()) >= 2  # at least the two we just created


def test_patch_application_updates_fields(client):
    """Tests updating an application."""
    created = client.post("/api/v1/applications/", json=_new_payload("Delta Co")).json()
    app_id = created["id"]

    r = client.patch(
        f"/api/v1/applications/{app_id}",
        json={
            "pipeline_status": PipelineStatus.STAGE_1.value,
            "notes": "Recruiter screen scheduled",
        },
    )
    assert r.status_code == status.HTTP_200_OK, r.text
    body = r.json()
    assert body["pipeline_status"] == PipelineStatus.STAGE_1.value
    assert body["notes"] == "Recruiter screen scheduled"


def test_delete_application_then_404_on_get(client):
    """Tests deleting an application then getting it returns 404."""
    created = client.post(
        "/api/v1/applications/", json=_new_payload("To Delete")
    ).json()
    app_id = created["id"]

    r_del = client.delete(f"/api/v1/applications/{app_id}")
    assert r_del.status_code == status.HTTP_204_NO_CONTENT

    r_get = client.get(f"/api/v1/applications/{app_id}")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND
