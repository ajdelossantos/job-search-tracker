"""Utility functions for datetime parsing and serialization in UTC with 'Z' suffix."""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, Union


def _coerce_datetime(v: Union[str, datetime]) -> datetime:
    if isinstance(v, datetime):
        return v
    if isinstance(v, str):
        # Support 'Z' and '+00:00'
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    raise TypeError("Expected datetime or ISO8601 string")


def parse_required_aware_to_utc(v: Union[str, datetime]) -> datetime:
    """
    Require tz-aware input; return UTC aware with microseconds dropped.
    Use this in *create/update* validators only (never in Read).
    """
    dt = _coerce_datetime(v)
    if dt.tzinfo is None:
        raise ValueError("Datetime must be timezone-aware (e.g., '...Z').")
    return dt.astimezone(timezone.utc).replace(microsecond=0)


def to_z(dt: Optional[datetime]) -> Optional[str]:
    """
    Serialize to '...Z' with no microseconds.
    Treat naive as UTC (SQLite) before formatting.
    Use this in Read serializers.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc).replace(microsecond=0)
    return dt.isoformat().replace("+00:00", "Z")
