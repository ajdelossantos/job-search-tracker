"""Application domain service.

Centralizes side-effects around Applications (e.g., writing PipelineHistory)
so routers stay thin and the audit trail remains correct.

- CREATE: after the Application is staged, also insert PipelineHistory(None -> initial_status)
  in the same txn.
- UPDATE: if pipeline_status changes, insert PipelineHistory(old -> new).
- DELETE: delete via ORM instance so ON DELETE CASCADE / relationship cascades take effect.
"""

from typing import Optional
from sqlalchemy.orm import Session, selectinload

from app.models.models import Applications, PipelineHistory
from app.schemas.applications import ApplicationCreate, ApplicationUpdate


def _load_app_with_relations(db: Session, application_id: int) -> Applications:
    """Reload an Application with related collections for response serialization."""
    application = db.get(
        Applications,
        application_id,
        options=(
            selectinload(Applications.interviews),
            selectinload(Applications.contacts),
            selectinload(Applications.pipeline_histories),
        ),
    )

    assert application is not None  # appease mypy: we only call with a known id
    return application


def create_application_with_history(
    db: Session, payload: ApplicationCreate
) -> Applications:
    """Create an application and its initial pipeline history entry in one transaction."""
    data = payload.model_dump()
    # Coerce URL field to str for DB column
    if data.get("url"):
        data["url"] = str(data["url"])

    application = Applications(**data)
    db.add(application)
    db.flush()  # ensures application.id is available without committing

    assert application.id is not None  # mypy: int not Optional[int]

    # Initial history: None -> application.pipeline_status
    db.add(
        PipelineHistory(
            application_id=application.id,
            from_status=None,
            to_status=application.pipeline_status,
            note=None,
        )
    )

    db.commit()
    return _load_app_with_relations(db, application.id)


def update_application_with_history(
    db: Session, application_id: int, payload: ApplicationUpdate
) -> Optional[Applications]:
    """
    Update an application. If pipeline_status changes, append a PipelineHistory entry.
    Returns the updated application (with relations), or None if not found.
    """
    application = db.get(Applications, application_id)
    if application is None:
        return None

    before_status = application.pipeline_status
    data = payload.model_dump(exclude_unset=True)

    # Coerce URL on update
    if "url" in data and data["url"] is not None:
        data["url"] = str(data["url"])

    # Apply updates
    for k, v in data.items():
        setattr(application, k, v)

    # History only if status actually changed
    if "pipeline_status" in data and application.pipeline_status != before_status:
        db.add(
            PipelineHistory(
                application_id=application_id,
                from_status=before_status,
                to_status=application.pipeline_status,
                note=None,
            )
        )

    db.commit()
    return _load_app_with_relations(db, application_id)


def delete_application_and_history(db: Session, application_id: int) -> bool:
    """
    Delete an application by ID via ORM delete (so cascades trigger).
    Returns True if deleted, False if not found.
    """
    application = db.get(Applications, application_id)
    if application is None:
        return False

    db.delete(application)  # ORM delete + FK ON DELETE CASCADE take care of children
    db.commit()
    return True
