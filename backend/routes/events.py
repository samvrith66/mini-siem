import json
from flask import Blueprint, request, jsonify

from database import get_db, execute_db, query_db
from detection.engine import evaluate_event
from models import (
    VALID_SEVERITIES,
    error_response,
    get_utc_now_iso,
    row_to_event,
    validate_iso_timestamp,
)

events_bp = Blueprint("events", __name__, url_prefix="/api/events")


@events_bp.route("", methods=["GET"])
def list_events():
    """List security events with optional filtering, pagination, and search."""
    try:
        limit = min(max(int(request.args.get("limit", 50)), 1), 500)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return error_response("Invalid pagination parameter (limit and offset must be integers)", 400)

    severity = request.args.get("severity", "").strip().upper()
    event_type = request.args.get("event_type", "").strip()
    source_ip = request.args.get("source_ip", "").strip()
    destination_ip = request.args.get("destination_ip", "").strip()
    user = request.args.get("user", "").strip()
    search = request.args.get("search", "").strip()
    start_time = request.args.get("start_time", "").strip()
    end_time = request.args.get("end_time", "").strip()

    where_clauses = []
    params = []

    if severity:
        if severity in VALID_SEVERITIES:
            where_clauses.append("severity = ?")
            params.append(severity)
        else:
            return error_response(f"Invalid severity filter. Allowed values: {sorted(list(VALID_SEVERITIES))}", 400)

    if event_type:
        where_clauses.append("event_type = ?")
        params.append(event_type)

    if source_ip:
        where_clauses.append("source_ip = ?")
        params.append(source_ip)

    if destination_ip:
        where_clauses.append("destination_ip = ?")
        params.append(destination_ip)

    if user:
        where_clauses.append("user = ?")
        params.append(user)

    if start_time:
        where_clauses.append("timestamp >= ?")
        params.append(start_time)

    if end_time:
        where_clauses.append("timestamp <= ?")
        params.append(end_time)

    if search:
        where_clauses.append("(message LIKE ? OR user LIKE ? OR source_ip LIKE ? OR destination_ip LIKE ?)")
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    # Get total count
    count_query = f"SELECT COUNT(*) AS total FROM events {where_sql}"
    total_row = query_db(count_query, params, one=True)
    total_count = total_row["total"] if total_row else 0

    # Get paginated events
    data_query = f"SELECT * FROM events {where_sql} ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?"
    data_params = params + [limit, offset]
    rows = query_db(data_query, data_params)

    events_list = [row_to_event(r) for r in rows]

    return jsonify({
        "events": events_list,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }), 200


@events_bp.route("/<int:event_id>", methods=["GET"])
def get_event(event_id: int):
    """Retrieve details of a single event by ID."""
    row = query_db("SELECT * FROM events WHERE id = ?", (event_id,), one=True)
    if not row:
        return error_response(f"Event with ID {event_id} not found", 404, "EVENT_NOT_FOUND")
    return jsonify({"event": row_to_event(row)}), 200


@events_bp.route("", methods=["POST"])
def ingest_event():
    """Ingest a new security event and evaluate detection rules."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("Invalid or missing JSON payload in request body", 400)

    # Validate required fields
    event_type = data.get("event_type")
    source_ip = data.get("source_ip")
    if not event_type or not str(event_type).strip():
        return error_response("Field 'event_type' is required", 400, "MISSING_FIELD")
    if not source_ip or not str(source_ip).strip():
        return error_response("Field 'source_ip' is required", 400, "MISSING_FIELD")

    event_type = str(event_type).strip()
    source_ip = str(source_ip).strip()
    destination_ip = str(data["destination_ip"]).strip() if data.get("destination_ip") else None

    # Handle ports safely
    source_port = data.get("source_port")
    destination_port = data.get("destination_port")
    try:
        source_port = int(source_port) if source_port is not None else None
    except (ValueError, TypeError):
        return error_response("source_port must be an integer", 400)

    try:
        destination_port = int(destination_port) if destination_port is not None else None
    except (ValueError, TypeError):
        return error_response("destination_port must be an integer", 400)

    protocol = str(data.get("protocol", "TCP")).strip().upper()
    severity = str(data.get("severity", "INFO")).strip().upper()
    if severity not in VALID_SEVERITIES:
        severity = "INFO"

    timestamp = validate_iso_timestamp(data.get("timestamp"))
    user = str(data["user"]).strip() if data.get("user") else None
    message = str(data.get("message", "")).strip()

    raw_data = data.get("raw_data")
    if raw_data is not None and not isinstance(raw_data, str):
        raw_data = json.dumps(raw_data)

    db = get_db()
    try:
        cur = db.execute(
            """
            INSERT INTO events (
                timestamp, source_ip, destination_ip, source_port, destination_port,
                protocol, event_type, severity, user, message, raw_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                timestamp, source_ip, destination_ip, source_port, destination_port,
                protocol, event_type, severity, user, message, raw_data
            )
        )
        db.commit()
        event_id = cur.lastrowid
    except Exception:
        db.rollback()
        return error_response("Failed to persist event to database", 500, "DATABASE_ERROR")

    # Fetch inserted row
    new_row = query_db("SELECT * FROM events WHERE id = ?", (event_id,), one=True)
    event_dict = row_to_event(new_row)

    # Trigger detection engine
    triggered_alerts = evaluate_event(db, event_dict)

    return jsonify({
        "message": "Event recorded successfully",
        "event": event_dict,
        "triggered_alerts": triggered_alerts
    }), 201


@events_bp.route("", methods=["DELETE"])
def clear_events():
    """Clear all events (used for educational simulation and lab resets)."""
    _, count = execute_db("DELETE FROM events")
    return jsonify({
        "message": "All events cleared successfully",
        "deleted_count": count
    }), 200
