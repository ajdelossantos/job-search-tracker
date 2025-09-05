"""Tests for contact API endpoints."""

from datetime import date
from fastapi import status
from app.core.enums import JobLocation, PipelineStatus, ResolutionStatus
from app.models.models import Applications, Contacts


def _new_contact(name="Jordan Recruiter"):
    return {
        "name": name,
        "company": "Acme",
        "email": "jordan@acme.com",
        "title": "Recruiter",
        "url": "https://acme.com/jordan",
        "role": "recruiter",
        "phone": "+15125551212",
        "notes": "N/A",
    }


def _new_application(company="Acme"):
    return {
        "date_applied": str(date.today()),
        "company": company,
        "role": "SWE",
        "job_location": JobLocation.REMOTE.value,
        "pipeline_status": PipelineStatus.APPLIED.value,
        "resolution_status": ResolutionStatus.ONGOING.value,
    }


def test_create_contact_returns_read(client):
    """Test creating a contact returns the correct data."""
    r = client.post("/api/v1/contacts/", json=_new_contact())
    assert r.status_code == status.HTTP_201_CREATED, r.text
    body = r.json()
    assert isinstance(body["id"], int)
    assert body["name"] == "Jordan Recruiter"
    assert body["application_ids"] == []


def test_get_contact_by_id(client, make_contact):
    """Test retrieving a contact by ID."""
    created = make_contact(name="Taylor")
    r = client.get(f"/api/v1/contacts/{created.id}")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["name"] == "Taylor"


def test_list_contacts_pagination(client, make_contact):
    """Test listing contacts with pagination."""
    make_contact(name="A")
    make_contact(name="B")
    r = client.get("/api/v1/contacts/?limit=1&offset=0")
    assert r.status_code == 200 and len(r.json()) == 1


def test_patch_contact_updates_fields(client):
    """Test updating specific fields of a contact."""
    created = client.post("/api/v1/contacts/", json=_new_contact("Delta")).json()
    r = client.patch(f"/api/v1/contacts/{created['id']}", json={"notes": "Updated"})
    assert r.status_code == 200
    assert r.json()["notes"] == "Updated"


def test_delete_contact_then_404_on_get(client):
    """Test deleting a contact then getting it returns 404."""
    created = client.post("/api/v1/contacts/", json=_new_contact("Delete Me")).json()
    cid = created["id"]
    r_del = client.delete(f"/api/v1/contacts/{cid}")
    assert r_del.status_code == status.HTTP_204_NO_CONTENT
    r_get = client.get(f"/api/v1/contacts/{cid}")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND


def test_contact_application_ids_reflect_relationship(client, db_session):
    """Test that the application_ids field reflects the relationship with applications."""
    # create contact + application via API
    contact = client.post("/api/v1/contacts/", json=_new_contact("Rel Test")).json()
    app = client.post("/api/v1/applications/", json=_new_application("Rel Co")).json()

    # link them via ORM in test DB (M2M)
    c_obj = db_session.get(Contacts, contact["id"])
    a_obj = db_session.get(Applications, app["id"])
    c_obj.applications.append(a_obj)
    db_session.add(c_obj)
    db_session.commit()

    # now the read should show the app id in application_ids
    r = client.get(f"/api/v1/contacts/{contact['id']}")
    assert r.status_code == 200
    assert r.json()["application_ids"] == [app["id"]]


def test_list_contacts_filtered_by_application_id(
    client, db_session, make_contact, make_application
):
    """Test listing contacts filtered by application ID."""
    # create a contact and an application
    c = make_contact(name="Filter Me")
    a = make_application(company="Acme")

    # link them in the DB
    c_obj = db_session.get(Contacts, c.id)
    a_obj = db_session.get(Applications, a.id)
    c_obj.applications.append(a_obj)
    db_session.add(c_obj)
    db_session.commit()

    # filter by application_id → should return the linked contact
    r = client.get(f"/api/v1/contacts/?application_id={a.id}")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1 and items[0]["id"] == c.id


def test_list_contacts_filtered_by_application_id_not_linked_returns_empty(client):
    """Test listing contacts filtered by application ID not linked returns empty."""
    r = client.get("/api/v1/contacts/?application_id=999999")
    assert r.status_code == 200
    assert r.json() == []


def test_create_contact_with_application_ids_links_relationship(client, db_session):
    # create an application first
    app = client.post(
        "/api/v1/applications/", json=_new_application("Linked Co")
    ).json()

    # create contact and link it at creation time
    payload = _new_contact("With Link")
    payload["application_ids"] = [app["id"]]
    r = client.post("/api/v1/contacts/", json=payload)

    assert r.status_code == status.HTTP_201_CREATED, r.text
    body = r.json()
    assert body["application_ids"] == [app["id"]]

    # sanity-check via ORM that the M2M exists
    c = db_session.get(Contacts, body["id"])
    assert {a.id for a in c.applications} == {app["id"]}


def test_create_contact_with_invalid_application_ids_returns_400(client):
    payload = _new_contact("Bad Link")
    payload["application_ids"] = [999_999]
    r = client.post("/api/v1/contacts/", json=payload)
    assert r.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid application_ids" in r.text


def test_patch_contact_add_and_remove_application_ids(client, db_session):
    # seed: one contact, two apps
    contact = client.post("/api/v1/contacts/", json=_new_contact("Patch Links")).json()
    app1 = client.post("/api/v1/applications/", json=_new_application("App One")).json()
    app2 = client.post("/api/v1/applications/", json=_new_application("App Two")).json()

    # add both links
    r_add = client.patch(
        f"/api/v1/contacts/{contact['id']}",
        json={"application_ids_add": [app1["id"], app2["id"]]},
    )
    assert r_add.status_code == status.HTTP_200_OK, r_add.text
    body = r_add.json()
    assert set(body["application_ids"]) == {app1["id"], app2["id"]}

    # idempotency: add again should not duplicate (association PK prevents dup rows)
    r_add_again = client.patch(
        f"/api/v1/contacts/{contact['id']}",
        json={"application_ids_add": [app1["id"]]},
    )
    assert r_add_again.status_code == status.HTTP_200_OK
    body2 = r_add_again.json()
    assert set(body2["application_ids"]) == {app1["id"], app2["id"]}

    # remove one link
    r_remove = client.patch(
        f"/api/v1/contacts/{contact['id']}",
        json={"application_ids_remove": [app1["id"]]},
    )
    assert r_remove.status_code == status.HTTP_200_OK
    body3 = r_remove.json()
    assert body3["application_ids"] == [app2["id"]]

    # ORM sanity check
    c = db_session.get(Contacts, contact["id"])
    assert {a.id for a in c.applications} == {app2["id"]}


def test_list_contacts_filtered_by_application_id_works_with_created_link(client):
    # link via POST application_ids and then filter
    app = client.post(
        "/api/v1/applications/", json=_new_application("Filter Co")
    ).json()
    contact_payload = _new_contact("Filter Link")
    contact_payload["application_ids"] = [app["id"]]
    created = client.post("/api/v1/contacts/", json=contact_payload).json()

    r = client.get(f"/api/v1/contacts/?application_id={app['id']}")
    assert r.status_code == status.HTTP_200_OK
    items = r.json()
    assert len(items) == 1 and items[0]["id"] == created["id"]
