from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify

from database import query_db
from models import VALID_SEVERITIES

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")


def _get_cutoff_iso(hours: int = 24) -> str:
    """Return ISO 8601 string for hours in the past."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    return cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")


def _get_summary_data(cutoff_24h: str) -> dict:
    """Compute summary count metrics."""
    ev_total = query_db("SELECT COUNT(*) AS c FROM events", one=True)["c"]
    ev_24h = query_db("SELECT COUNT(*) AS c FROM events WHERE timestamp >= ?", (cutoff_24h,), one=True)["c"]

    al_total = query_db("SELECT COUNT(*) AS c FROM alerts", one=True)["c"]
    al_24h = query_db("SELECT COUNT(*) AS c FROM alerts WHERE timestamp >= ?", (cutoff_24h,), one=True)["c"]
    al_open = query_db("SELECT COUNT(*) AS c FROM alerts WHERE status = 'OPEN'", one=True)["c"]
    al_investigating = query_db("SELECT COUNT(*) AS c FROM alerts WHERE status = 'INVESTIGATING'", one=True)["c"]
    al_resolved = query_db("SELECT COUNT(*) AS c FROM alerts WHERE status = 'RESOLVED'", one=True)["c"]
    al_critical = query_db("SELECT COUNT(*) AS c FROM alerts WHERE severity = 'CRITICAL'", one=True)["c"]
    al_high = query_db("SELECT COUNT(*) AS c FROM alerts WHERE severity = 'HIGH'", one=True)["c"]

    return {
        "total_events": ev_total,
        "events_last_24h": ev_24h,
        "total_alerts": al_total,
        "alerts_last_24h": al_24h,
        "open_alerts": al_open,
        "investigating_alerts": al_investigating,
        "resolved_alerts": al_resolved,
        "critical_alerts": al_critical,
        "high_alerts": al_high
    }


def _get_severity_distribution_data() -> dict:
    """Compute event and alert counts partitioned by severity level."""
    events_raw = query_db("SELECT severity, COUNT(*) AS count FROM events GROUP BY severity")
    alerts_raw = query_db("SELECT severity, COUNT(*) AS count FROM alerts GROUP BY severity")

    events_by_sev = {sev: 0 for sev in sorted(VALID_SEVERITIES)}
    alerts_by_sev = {sev: 0 for sev in sorted(VALID_SEVERITIES) if sev != "INFO"}

    for r in events_raw:
        if r["severity"] in events_by_sev:
            events_by_sev[r["severity"]] = r["count"]

    for r in alerts_raw:
        if r["severity"] in alerts_by_sev:
            alerts_by_sev[r["severity"]] = r["count"]

    return {
        "events": events_by_sev,
        "alerts": alerts_by_sev
    }


@stats_bp.route("", methods=["GET"])
def get_stats():
    """Retrieve primary SIEM dashboard statistics combining summary metrics and severity distributions."""
    cutoff_24h = _get_cutoff_iso(24)
    summary = _get_summary_data(cutoff_24h)
    distribution = _get_severity_distribution_data()
    return jsonify({
        **summary,
        "severity_distribution": distribution
    }), 200


@stats_bp.route("/summary", methods=["GET"])
def get_summary():
    """Retrieve high-level SIEM summary metrics for dashboard cards."""
    cutoff_24h = _get_cutoff_iso(24)
    return jsonify(_get_summary_data(cutoff_24h)), 200


@stats_bp.route("/severity-distribution", methods=["GET"])
def get_severity_distribution():
    """Count of events and alerts partitioned by severity level."""
    return jsonify(_get_severity_distribution_data()), 200


@stats_bp.route("/event-types", methods=["GET"])
def get_top_event_types():
    """Retrieve counts for top security event types."""
    rows = query_db(
        "SELECT event_type, COUNT(*) AS count FROM events GROUP BY event_type ORDER BY count DESC LIMIT 10"
    )
    return jsonify({
        "event_types": [{"event_type": r["event_type"], "count": r["count"]} for r in rows]
    }), 200


@stats_bp.route("/top-ips", methods=["GET"])
def get_top_ips():
    """Retrieve top source and destination IPs by event volume."""
    src_rows = query_db(
        "SELECT source_ip, COUNT(*) AS count FROM events WHERE source_ip IS NOT NULL GROUP BY source_ip ORDER BY count DESC LIMIT 5"
    )
    dst_rows = query_db(
        "SELECT destination_ip, COUNT(*) AS count FROM events WHERE destination_ip IS NOT NULL GROUP BY destination_ip ORDER BY count DESC LIMIT 5"
    )

    return jsonify({
        "top_source_ips": [{"ip": r["source_ip"], "count": r["count"]} for r in src_rows],
        "top_destination_ips": [{"ip": r["destination_ip"], "count": r["count"]} for r in dst_rows]
    }), 200


@stats_bp.route("/timeline", methods=["GET"])
def get_timeline():
    """Retrieve hourly time-series aggregation of events and alerts for the past 24 hours."""
    cutoff_24h = _get_cutoff_iso(24)

    # Substring index 1 to 13 captures "YYYY-MM-DDTHH"
    events_rows = query_db(
        """
        SELECT substr(timestamp, 1, 13) AS hour_bucket, COUNT(*) AS count
        FROM events
        WHERE timestamp >= ?
        GROUP BY hour_bucket
        ORDER BY hour_bucket ASC
        """,
        (cutoff_24h,)
    )

    alerts_rows = query_db(
        """
        SELECT substr(timestamp, 1, 13) AS hour_bucket, COUNT(*) AS count
        FROM alerts
        WHERE timestamp >= ?
        GROUP BY hour_bucket
        ORDER BY hour_bucket ASC
        """,
        (cutoff_24h,)
    )

    events_map = {r["hour_bucket"]: r["count"] for r in events_rows}
    alerts_map = {r["hour_bucket"]: r["count"] for r in alerts_rows}

    # Generate complete list of past 24 hourly buckets
    now = datetime.now(timezone.utc)
    timeline = []
    for i in range(24, -1, -1):
        bucket_dt = now - timedelta(hours=i)
        bucket_key = bucket_dt.strftime("%Y-%m-%dT%H")
        timeline.append({
            "hour": f"{bucket_key}:00:00Z",
            "events": events_map.get(bucket_key, 0),
            "alerts": alerts_map.get(bucket_key, 0)
        })

    return jsonify({
        "timeline": timeline
    }), 200
