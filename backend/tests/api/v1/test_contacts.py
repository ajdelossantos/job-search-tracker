# tests/api/v1/test_contacts.py
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
    r = client.post("/api/v1/contacts/", json=_new_contact())
    assert r.status_code == status.HTTP_201_CREATED, r.text
    body = r.json()
    assert isinstance(body["id"], int)
    assert body["name"] == "Jordan Recruiter"
    assert body["application_ids"] == []


def test_get_contact_by_id(client):
    created = client.post("/api/v1/contacts/", json=_new_contact("Taylor")).json()
    r = client.get(f"/api/v1/contacts/{created['id']}")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["name"] == "Taylor"


def test_list_contacts_pagination(client):
    client.post("/api/v1/contacts/", json=_new_contact("A"))
    client.post("/api/v1/contacts/", json=_new_contact("B"))
    r = client.get("/api/v1/contacts/?limit=1&offset=0")
    assert r.status_code == 200 and len(r.json()) == 1


def test_patch_contact_updates_fields(client):
    created = client.post("/api/v1/contacts/", json=_new_contact("Delta")).json()
    r = client.patch(f"/api/v1/contacts/{created['id']}", json={"notes": "Updated"})
    assert r.status_code == 200
    assert r.json()["notes"] == "Updated"


def test_delete_contact_then_404_on_get(client):
    created = client.post("/api/v1/contacts/", json=_new_contact("Delete Me")).json()
    cid = created["id"]
    r_del = client.delete(f"/api/v1/contacts/{cid}")
    assert r_del.status_code == status.HTTP_204_NO_CONTENT
    r_get = client.get(f"/api/v1/contacts/{cid}")
    assert r_get.status_code == status.HTTP_404_NOT_FOUND


def test_contact_application_ids_reflect_relationship(client, db_session):
    # create contact + application via API
    contact = client.post("/api/v1/contacts/", json=_new_contact("Rel Test")).json()
    app = client.post("/api/v1/applications/", json=_new_application("Rel Co")).json()

    # link them via ORM in test DB (M2M)
    c_obj = db_session.query(Contacts).get(contact["id"])
    a_obj = db_session.query(Applications).get(app["id"])
    c_obj.applications.append(a_obj)
    db_session.add(c_obj)
    db_session.commit()

    # now the read should show the app id in application_ids
    r = client.get(f"/api/v1/contacts/{contact['id']}")
    assert r.status_code == 200
    assert r.json()["application_ids"] == [app["id"]]
