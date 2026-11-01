import json
from flask import Blueprint, request, jsonify

from database import get_db, execute_db, query_db
from models import (
    VALID_ALERT_STATUSES,
    VALID_SEVERITIES,
    error_response,
    row_to_alert,
)

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")


@alerts_bp.route("", methods=["GET"])
def list_alerts():
    """List security alerts with optional filtering by status, severity, and rule."""
    try:
        limit = min(max(int(request.args.get("limit", 50)), 1), 500)
        offset = max(int(request.args.get("offset", 0)), 0)
    except ValueError:
        return error_response("Invalid pagination parameter (limit and offset must be integers)", 400)

    status = request.args.get("status", "").strip().upper()
    severity = request.args.get("severity", "").strip().upper()
    rule_id = request.args.get("rule_id", "").strip()
    source_ip = request.args.get("source_ip", "").strip()

    where_clauses = []
    params = []

    if status:
        if status in VALID_ALERT_STATUSES:
            where_clauses.append("status = ?")
            params.append(status)
        else:
            return error_response(f"Invalid status filter. Allowed values: {sorted(list(VALID_ALERT_STATUSES))}", 400)

    if severity:
        if severity in VALID_SEVERITIES:
            where_clauses.append("severity = ?")
            params.append(severity)
        else:
            return error_response(f"Invalid severity filter. Allowed values: {sorted(list(VALID_SEVERITIES))}", 400)

    if rule_id:
        where_clauses.append("rule_id = ?")
        params.append(rule_id)

    if source_ip:
        where_clauses.append("source_ip = ?")
        params.append(source_ip)

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    # Count total matching alerts
    count_query = f"SELECT COUNT(*) AS total FROM alerts {where_sql}"
    total_row = query_db(count_query, params, one=True)
    total_count = total_row["total"] if total_row else 0

    # Fetch alerts
    data_query = f"SELECT * FROM alerts {where_sql} ORDER BY timestamp DESC, id DESC LIMIT ? OFFSET ?"
    data_params = params + [limit, offset]
    rows = query_db(data_query, data_params)

    return jsonify({
        "alerts": [row_to_alert(r) for r in rows],
        "total": total_count,
        "limit": limit,
        "offset": offset
    }), 200


@alerts_bp.route("/<int:alert_id>", methods=["GET"])
def get_alert(alert_id: int):
    """Retrieve details of a single alert by ID."""
    row = query_db("SELECT * FROM alerts WHERE id = ?", (alert_id,), one=True)
    if not row:
        return error_response(f"Alert with ID {alert_id} not found", 404, "ALERT_NOT_FOUND")
    return jsonify({"alert": row_to_alert(row)}), 200


@alerts_bp.route("/<int:alert_id>", methods=["PATCH", "PUT"])
def update_alert(alert_id: int):
    """Update alert status (e.g. INVESTIGATING, RESOLVED) or mitigation notes."""
    existing = query_db("SELECT * FROM alerts WHERE id = ?", (alert_id,), one=True)
    if not existing:
        return error_response(f"Alert with ID {alert_id} not found", 404, "ALERT_NOT_FOUND")

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("Invalid or missing JSON payload in request body", 400)

    updates = []
    params = []

    if "status" in data:
        new_status = str(data["status"]).strip().upper()
        if new_status not in VALID_ALERT_STATUSES:
            return error_response(
                f"Invalid status '{new_status}'. Allowed values: {sorted(list(VALID_ALERT_STATUSES))}",
                400
            )
        updates.append("status = ?")
        params.append(new_status)

    if "mitigation_hint" in data:
        updates.append("mitigation_hint = ?")
        params.append(str(data["mitigation_hint"]))

    if "details" in data:
        details_val = data["details"]
        if not isinstance(details_val, str):
            details_val = json.dumps(details_val)
        updates.append("details = ?")
        params.append(details_val)

    if not updates:
        return error_response("No valid fields provided to update", 400)

    params.append(alert_id)
    update_sql = f"UPDATE alerts SET {', '.join(updates)} WHERE id = ?"

    db = get_db()
    try:
        db.execute(update_sql, params)
        db.commit()
    except Exception:
        db.rollback()
        return error_response("Failed to update alert in database", 500, "DATABASE_ERROR")

    updated_row = query_db("SELECT * FROM alerts WHERE id = ?", (alert_id,), one=True)
    return jsonify({
        "message": "Alert updated successfully",
        "alert": row_to_alert(updated_row)
    }), 200


@alerts_bp.route("/<int:alert_id>", methods=["DELETE"])
def delete_alert(alert_id: int):
    """Delete a single alert by ID."""
    existing = query_db("SELECT * FROM alerts WHERE id = ?", (alert_id,), one=True)
    if not existing:
        return error_response(f"Alert with ID {alert_id} not found", 404, "ALERT_NOT_FOUND")

    execute_db("DELETE FROM alerts WHERE id = ?", (alert_id,))
    return jsonify({
        "message": f"Alert {alert_id} deleted successfully"
    }), 200


@alerts_bp.route("", methods=["DELETE"])
def clear_alerts():
    """Clear all alerts."""
    _, count = execute_db("DELETE FROM alerts")
    return jsonify({
        "message": "All alerts cleared successfully",
        "deleted_count": count
    }), 200
