from datetime import datetime, timezone
import json
import sqlite3
from typing import Any, Dict, Optional
from flask import jsonify

VALID_SEVERITIES = {"INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"}
VALID_ALERT_STATUSES = {"OPEN", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE", "CLOSED"}


def get_utc_now_iso() -> str:
    """Return the current UTC timestamp formatted as ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def validate_iso_timestamp(ts: Optional[str]) -> str:
    """Validate that a string is a valid ISO 8601 timestamp or return current UTC ISO timestamp."""
    if not ts:
        return get_utc_now_iso()
    try:
        # Standardize strings with 'Z'
        clean_ts = ts.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_ts)
        # Ensure UTC timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except (ValueError, TypeError):
        return get_utc_now_iso()


def error_response(
    message: str,
    status_code: int = 400,
    error_code: Optional[str] = None,
    details: Optional[Any] = None
):
    """Generate a consistent JSON error response structure across the entire application."""
    default_codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        500: "INTERNAL_SERVER_ERROR"
    }
    code = error_code or default_codes.get(status_code, "ERROR")
    payload = {
        "error": code,
        "message": message,
        "status_code": status_code,
        "timestamp": get_utc_now_iso()
    }
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status_code


def row_to_event(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert an SQLite Row from the events table into a serializable dictionary."""
    if not row:
        return {}
    raw_data = row["raw_data"]
    parsed_raw = raw_data
    if raw_data:
        try:
            parsed_raw = json.loads(raw_data)
        except (json.JSONDecodeError, TypeError):
            parsed_raw = raw_data

    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "source_ip": row["source_ip"],
        "destination_ip": row["destination_ip"],
        "source_port": row["source_port"],
        "destination_port": row["destination_port"],
        "protocol": row["protocol"],
        "event_type": row["event_type"],
        "severity": row["severity"],
        "user": row["user"],
        "message": row["message"],
        "raw_data": parsed_raw
    }


def row_to_alert(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert an SQLite Row from the alerts table into a serializable dictionary."""
    if not row:
        return {}
    details = row["details"]
    parsed_details = details
    if details:
        try:
            parsed_details = json.loads(details)
        except (json.JSONDecodeError, TypeError):
            parsed_details = details

    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "rule_id": row["rule_id"],
        "rule_name": row["rule_name"],
        "severity": row["severity"],
        "description": row["description"],
        "status": row["status"],
        "source_ip": row["source_ip"],
        "destination_ip": row["destination_ip"],
        "event_count": row["event_count"],
        "details": parsed_details,
        "mitigation_hint": row["mitigation_hint"]
    }
