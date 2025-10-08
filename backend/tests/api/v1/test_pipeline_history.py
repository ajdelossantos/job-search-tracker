"""Tests for Pipeline History API endpoint."""

from datetime import datetime, timedelta, timezone
from fastapi import status
from app.core.enums import PipelineStatus


def _new_history_payload(
    transition_date=None,
    to_status=PipelineStatus.APPLIED.value,
    from_status=None,
    note="moved",
):
    """Helper: build a minimal payload for creation endpoints."""
    payload = {"to_status": to_status, "note": note}
    if from_status is not None:
        payload["from_status"] = from_status
    if transition_date is not None:
        payload["transition_date"] = transition_date
    return payload


# ------------------ Nested: /applications/{application_id}/pipeline-history ------------------


def test_create_pipeline_history_nested_returns_read(client, make_application):
    """POST nested under application creates history and returns read model."""
    app_row = make_application(company="PH Co")
    r = client.post(
        f"/api/v1/applications/{app_row.id}/pipeline-history",
        json=_new_history_payload(
            to_status=PipelineStatus.APPLIED.value,
            from_status=PipelineStatus.WILL_APPLY.value,
            note="Applied via site",
        ),
    )
    assert r.status_code == status.HTTP_201_CREATED, r.text
    body = r.json()
    assert body["application_id"] == app_row.id
    assert body["to_status"] == PipelineStatus.APPLIED.value
    assert body["from_status"] == PipelineStatus.WILL_APPLY.value
    assert body["note"] == "Applied via site"
    assert "changed_at" in body
    assert "transition_date" in body


def test_create_pipeline_history_nested_missing_app_returns_404(client):
    """POST nested with a non-existent application id returns 404."""
    r = client.post(
        "/api/v1/applications/999999/pipeline-history",
        json=_new_history_payload(),
    )
    assert r.status_code == status.HTTP_404_NOT_FOUND


def test_list_pipeline_histories_by_application_nested_and_flat(
    client, make_application, make_pipeline_history
):
    """LIST nested and flat (filtered) show the same rows in reverse chronological order."""
    app_row = make_application(company="Order Co")
    # Two entries with different changed_at for deterministic ordering
    t2 = datetime.now(timezone.utc)
    t1 = t2 - timedelta(minutes=5)

    h1 = make_pipeline_history(
        application_id=app_row.id,
        from_status=PipelineStatus.WILL_APPLY,
        to_status=PipelineStatus.APPLIED,
        note="first",
        changed_at=t1,
    )
    h2 = make_pipeline_history(
        application_id=app_row.id,
        from_status=PipelineStatus.APPLIED,
        to_status=PipelineStatus.STAGE_1,
        note="second",
        changed_at=t2,
    )

    # Nested list
    rn = client.get(f"/api/v1/applications/{app_row.id}/pipeline-history")
    assert rn.status_code == 200
    nested = rn.json()
    assert [item["id"] for item in nested] == [h2.id, h1.id]  # most recent first

    # Flat filtered list
    rf = client.get(f"/api/v1/pipeline-history?application_id={app_row.id}")
    assert rf.status_code == 200
    flat = rf.json()
    assert [item["id"] for item in flat] == [h2.id, h1.id]


# ------------------ Flat: /pipeline-history ------------------


def test_get_pipeline_history_by_id(client, make_pipeline_history):
    """GET by id returns a single PipelineHistory item."""
    hist = make_pipeline_history(note="read me")
    r = client.get(f"/api/v1/pipeline-history/{hist.id}")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == hist.id
    assert body["note"] == "read me"
    assert body["to_status"] == PipelineStatus.APPLIED.value


def test_patch_pipeline_history_updates_note_only(client, make_pipeline_history):
    """PATCH updates the note when valid payload is provided."""
    hist = make_pipeline_history(
        from_status=PipelineStatus.APPLIED,
        to_status=PipelineStatus.STAGE_1,
        note="orig",
    )
    r = client.patch(f"/api/v1/pipeline-history/{hist.id}", json={"note": "updated"})
    assert r.status_code == 200
    assert r.json()["note"] == "updated"
    assert r.json()["to_status"] == PipelineStatus.STAGE_1.value


def test_patch_pipeline_history_rejects_status_fields(client, make_pipeline_history):
    """PATCH with forbidden fields (e.g. to_status) returns 422."""
    hist = make_pipeline_history(
        from_status=PipelineStatus.APPLIED,
        to_status=PipelineStatus.STAGE_1,
        note="orig",
    )
    r = client.patch(
        f"/api/v1/pipeline-history/{hist.id}",
        json={"to_status": PipelineStatus.STAGE_2.value, "note": "updated"},
    )
    assert r.status_code == 422


def test_delete_pipeline_history_then_404_on_get(client, make_pipeline_history):
    """DELETE removes the row; subsequent GET returns 404."""
    hist = make_pipeline_history(note="bye")
    r_del = client.delete(f"/api/v1/pipeline-history/{hist.id}")
    assert r_del.status_code == status.HTTP_204_NO_CONTENT

    r_get = client.get(f"/api/v1/pipeline-history/{hist.id}")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND


def test_flat_post_still_works_if_enabled(client, make_application):
    """(Optional) Flat POST creates history when enabled."""
    app_row = make_application(company="Flat Co")
    r = client.post(
        "/api/v1/pipeline-history",
        json={
            "application_id": app_row.id,
            "to_status": PipelineStatus.STAGE_1.value,
            "from_status": PipelineStatus.APPLIED.value,
            "note": "transitioned",
        },
    )
    assert r.status_code in (status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND), r.text
    # If your implementation does not include flat POST, 404 is acceptable; otherwise 201 is expected.
    if r.status_code == status.HTTP_201_CREATED:
        body = r.json()
        assert body["application_id"] == app_row.id
        assert body["to_status"] == PipelineStatus.STAGE_1.value


def test_flat_post_invalid_application_id_returns_400(client):
    """Flat POST with a bad application_id returns 400 (if flat POST is supported)."""
    r = client.post(
        "/api/v1/pipeline-history",
        json={
            "application_id": 999999,
            "to_status": PipelineStatus.STAGE_1.value,
            "note": "bad app",
        },
    )
    # If you don't support flat POST, this will be 404 instead; allow either
    assert r.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND)
