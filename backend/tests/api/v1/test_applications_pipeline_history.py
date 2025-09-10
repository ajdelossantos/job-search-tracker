# tests/api/v1/test_applications_pipeline_history.py
"""Integration tests ensuring Application ↔ PipelineHistory coupling.

Covers:
- Creating an application writes an initial history: None → initial_status
- Updating pipeline_status appends a history row (old → new)
- Updating without a status change does not create history
- Deleting an application cascades removal of its histories
"""

from datetime import date
from fastapi import status
from app.core.enums import JobLocation, PipelineStatus, ResolutionStatus


def _new_app_payload(
    company: str = "HistCo", status_value: str = PipelineStatus.WILL_APPLY.value
):
    return {
        "date_applied": str(date.today()),
        "company": company,
        "role": "SWE",
        "job_location": JobLocation.REMOTE.value,
        "pipeline_status": status_value,
        "resolution_status": ResolutionStatus.ONGOING.value,
    }


def _list_history(client, app_id: int):
    r = client.get(f"/api/v1/pipeline-history?application_id={app_id}")
    assert r.status_code == 200
    return r.json()


def test_create_application_writes_initial_history(client):
    """POST /applications creates a PipelineHistory row: None → initial pipeline_status."""
    created = client.post(
        "/api/v1/applications/", json=_new_app_payload("InitCo")
    ).json()
    app_id = created["id"]

    hist = _list_history(client, app_id)
    assert len(hist) == 1
    assert hist[0]["application_id"] == app_id
    assert hist[0]["from_status"] is None
    assert hist[0]["to_status"] == PipelineStatus.WILL_APPLY.value


def test_update_application_status_appends_history(client):
    """PATCH that changes pipeline_status appends a new history row (old → new)."""
    created = client.post(
        "/api/v1/applications/", json=_new_app_payload("MoveCo")
    ).json()
    app_id = created["id"]

    # change status
    r = client.patch(
        f"/api/v1/applications/{app_id}",
        json={"pipeline_status": PipelineStatus.STAGE_1.value},
    )
    assert r.status_code == status.HTTP_200_OK

    hist = _list_history(client, app_id)
    # Expect two rows total: initial + the change
    assert len(hist) == 2
    # Most-recent first (router orders desc), so index 0 should be old -> new
    assert hist[0]["from_status"] == PipelineStatus.WILL_APPLY.value
    assert hist[0]["to_status"] == PipelineStatus.STAGE_1.value


def test_update_without_status_change_does_not_append_history(client):
    """PATCH that does not change pipeline_status should not create a new history row."""
    created = client.post(
        "/api/v1/applications/", json=_new_app_payload("NoChangeCo")
    ).json()
    app_id = created["id"]

    # Update notes only
    r = client.patch(f"/api/v1/applications/{app_id}", json={"notes": "touch"})
    assert r.status_code == status.HTTP_200_OK

    hist = _list_history(client, app_id)
    assert len(hist) == 1  # only the initial row


def test_delete_application_cascades_history(client):
    """DELETE /applications/{id} removes the application and its pipeline history."""
    created = client.post(
        "/api/v1/applications/", json=_new_app_payload("DelCo")
    ).json()
    app_id = created["id"]

    # create a second history row via status change
    client.patch(
        f"/api/v1/applications/{app_id}",
        json={"pipeline_status": PipelineStatus.STAGE_1.value},
    )

    # Verify histories exist
    assert len(_list_history(client, app_id)) == 2

    # Delete the application
    r_del = client.delete(f"/api/v1/applications/{app_id}")
    assert r_del.status_code == status.HTTP_204_NO_CONTENT

    # App is gone
    r_get = client.get(f"/api/v1/applications/{app_id}")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND

    # Histories are gone (cascade)
    r_hist = client.get(f"/api/v1/pipeline-history?application_id={app_id}")
    assert r_hist.status_code == 200
    assert r_hist.json() == []
