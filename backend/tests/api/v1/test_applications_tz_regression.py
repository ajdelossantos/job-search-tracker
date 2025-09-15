# tests/api/v1/test_applications_tz_regression.py
"""Regression test: Application responses must normalize nested Interview.scheduled_date to be tz-aware.

Previously, returning an Application with nested Interviews that had naive datetimes
triggered a FastAPI ResponseValidationError (500). This test inserts naive interview rows
via the ORM (bypassing the router’s validators), then exercises both GET and PATCH
Application endpoints to ensure they return successfully and the nested interviews
serialize with timezone information (Z / +00:00).
"""

from datetime import datetime
from starlette import status

from app.core.enums import InterviewType, PipelineStatus
from app.models.models import Interviews, Applications


def _has_utc_marker(dt_str: str) -> bool:
    """Return True if the ISO string clearly shows UTC ('Z' or '+00:00')."""
    return dt_str.endswith("Z") or dt_str.endswith("+00:00")


def test_application_normalizes_nested_interview_datetimes(client, db_session):
    # 1) Create an application through the API (normal path)
    created_app = client.post(
        "/api/v1/applications/",
        json={
            "date_applied": "2025-09-01",
            "company": "TZ Co",
            "role": "SWE",
            "url": "https://example.com/tz",
            "job_location": "remote",
            "pipeline_status": "will_apply",
            "resolution_status": "ongoing",
            "notes": "seed",
        },
    ).json()
    app_id = created_app["id"]

    # 2) Insert naive Interview rows directly via ORM (no tzinfo)
    naive1 = datetime(2025, 8, 14, 19, 30, 0)  # naive on purpose
    naive2 = datetime(2025, 8, 19, 19, 30, 0)  # naive on purpose

    iv1 = Interviews(
        application_id=app_id,
        scheduled_date=naive1,
        type=InterviewType.RECRUITER,
        notes="Recruiter call",
    )
    iv2 = Interviews(
        application_id=app_id,
        scheduled_date=naive2,
        type=InterviewType.TECHNICAL,
        notes="Tech screen",
    )
    db_session.add_all([iv1, iv2])
    db_session.commit()

    # 3) GET the application -> must succeed and return tz-aware interview datetimes
    r_get = client.get(f"/api/v1/applications/{app_id}")
    assert r_get.status_code == status.HTTP_200_OK, r_get.text
    body = r_get.json()
    assert "interviews" in body and len(body["interviews"]) >= 2

    for iv in body["interviews"]:
        # Should be ISO string with Z or +00:00 (after normalization)
        assert isinstance(iv["scheduled_date"], str)
        assert _has_utc_marker(iv["scheduled_date"])

    # 4) PATCH the application (change status) -> must also return tz-aware interview datetimes
    r_patch = client.patch(
        f"/api/v1/applications/{app_id}",
        json={"pipeline_status": PipelineStatus.STAGE_1.value},
    )
    assert r_patch.status_code == status.HTTP_200_OK, r_patch.text
    patched = r_patch.json()
    assert patched["pipeline_status"] == PipelineStatus.STAGE_1.value
    assert "interviews" in patched and len(patched["interviews"]) >= 2

    for iv in patched["interviews"]:
        assert isinstance(iv["scheduled_date"], str)
        assert _has_utc_marker(iv["scheduled_date"])

    # Sanity: DB still has those interviews attached to our app (not strictly required, but nice)
    count = (
        db_session.query(Interviews).filter(Interviews.application_id == app_id).count()
    )
    assert count >= 2

    # Optional: confirm we didn’t accidentally change the application ID reference
    assert db_session.get(Applications, app_id) is not None
