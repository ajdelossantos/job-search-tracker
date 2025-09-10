"""Services and helpers for Interviews."""

from datetime import timezone
from app.models.models import Interviews


def ensure_aware_utc(iv: Interviews) -> Interviews:
    """Coerce naive datetimes to UTC for response safety (esp. with SQLite)."""
    if iv and iv.scheduled_date and iv.scheduled_date.tzinfo is None:
        iv.scheduled_date = iv.scheduled_date.replace(tzinfo=timezone.utc)
    return iv
