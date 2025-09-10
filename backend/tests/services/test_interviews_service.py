"""Unit tests for interview services."""

from datetime import datetime, timezone
from app.services.interviews_service import ensure_aware_utc


class _Dummy:
    """Simple stand-in with a scheduled_date attribute."""

    def __init__(self, dt):
        self.scheduled_date = dt


def test_ensure_aware_utc_coerces_naive_to_utc():
    """Naive datetimes are assumed to be UTC."""
    naive = datetime(2025, 1, 1, 12, 0, 0)  # no tzinfo
    obj = _Dummy(naive)

    out = ensure_aware_utc(obj)

    assert out.scheduled_date.tzinfo is not None
    assert out.scheduled_date.tzinfo == timezone.utc
    # time-of-day preserved when tz added
    assert out.scheduled_date.replace(tzinfo=None) == naive


def test_ensure_aware_utc_leaves_aware_unchanged():
    """Ensure aware datetimes remain unchanged."""
    aware = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    obj = _Dummy(aware)

    out = ensure_aware_utc(obj)

    # Value unchanged; identity is nice-to-have but not required
    assert out.scheduled_date == aware
    assert out.scheduled_date.tzinfo == timezone.utc
