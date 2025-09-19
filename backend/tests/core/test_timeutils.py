"""Tests for timeutils module."""

from datetime import datetime, timezone, timedelta
from app.core.timeutils import to_z, parse_required_aware_to_utc


def test_to_z_with_none():
    """Test to_z returns None when input is None."""
    assert to_z(None) is None


def test_to_z_with_naive_datetime():
    """Test to_z treats naive datetime as UTC and formats with Z suffix."""
    dt = datetime(2023, 1, 15, 10, 30, 45, 123456)
    result = to_z(dt)
    assert result == "2023-01-15T10:30:45Z"


def test_to_z_with_utc_datetime():
    """Test to_z formats UTC datetime with Z suffix and drops microseconds."""
    dt = datetime(2023, 1, 15, 10, 30, 45, 123456, tzinfo=timezone.utc)
    result = to_z(dt)
    assert result == "2023-01-15T10:30:45Z"


def test_to_z_with_non_utc_timezone():
    """Test to_z converts non-UTC timezone to UTC and formats with Z suffix."""
    tz_plus_2 = timezone(timedelta(hours=2))
    dt = datetime(2023, 1, 15, 12, 30, 45, tzinfo=tz_plus_2)
    result = to_z(dt)
    assert result == "2023-01-15T10:30:45Z"


def test_parse_required_aware_to_utc_with_z_suffix():
    """Test parse_required_aware_to_utc with Z suffix string."""
    result = parse_required_aware_to_utc("2023-01-15T10:30:45.123456Z")
    expected = datetime(2023, 1, 15, 10, 30, 45, tzinfo=timezone.utc)
    assert result == expected


def test_parse_required_aware_to_utc_with_utc_offset():
    """Test parse_required_aware_to_utc with +00:00 offset string."""
    result = parse_required_aware_to_utc("2023-01-15T10:30:45+00:00")
    expected = datetime(2023, 1, 15, 10, 30, 45, tzinfo=timezone.utc)
    assert result == expected


def test_parse_required_aware_to_utc_with_timezone_conversion():
    """Test parse_required_aware_to_utc converts non-UTC timezone to UTC."""
    result = parse_required_aware_to_utc("2023-01-15T12:30:45+02:00")
    expected = datetime(2023, 1, 15, 10, 30, 45, tzinfo=timezone.utc)
    assert result == expected


def test_parse_required_aware_to_utc_with_aware_datetime():
    """Test parse_required_aware_to_utc with timezone-aware datetime object."""
    tz_plus_2 = timezone(timedelta(hours=2))
    dt = datetime(2023, 1, 15, 12, 30, 45, 123456, tzinfo=tz_plus_2)
    result = parse_required_aware_to_utc(dt)
    expected = datetime(2023, 1, 15, 10, 30, 45, tzinfo=timezone.utc)
    assert result == expected


def test_parse_required_aware_to_utc_raises_on_naive_datetime():
    """Test parse_required_aware_to_utc raises ValueError for naive datetime."""
    dt = datetime(2023, 1, 15, 10, 30, 45)
    try:
        parse_required_aware_to_utc(dt)
        assert False, "Expected ValueError"
    except ValueError as e:
        assert "timezone-aware" in str(e)


def test_parse_required_aware_to_utc_raises_on_naive_string():
    """Test parse_required_aware_to_utc raises ValueError for naive datetime string."""
    try:
        parse_required_aware_to_utc("2023-01-15T10:30:45")
        assert False, "Expected ValueError"
    except ValueError as e:
        assert "timezone-aware" in str(e)
