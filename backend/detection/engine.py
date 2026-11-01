from datetime import datetime, timedelta, timezone
import json
import sqlite3
from typing import Any, Dict, List, Optional

from models import get_utc_now_iso, row_to_alert


def _get_window_timestamp(seconds_ago: int) -> str:
    """Return an ISO 8601 timestamp string representing a point in time seconds_ago."""
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=seconds_ago)
    return cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")


def _record_or_update_alert(
    db: sqlite3.Connection,
    rule_id: str,
    rule_name: str,
    severity: str,
    description: str,
    source_ip: Optional[str],
    destination_ip: Optional[str],
    details: Dict[str, Any],
    mitigation_hint: str,
    event_count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Insert a new alert or aggregate with an existing open alert for the same rule and source_ip.
    Prevents alert fatigue by incrementing event_count for repeated incidents within 5 minutes.
    If event_count is explicitly provided, it ensures the alert's event_count matches the correlated event count.
    """
    now = get_utc_now_iso()
    cutoff = _get_window_timestamp(300)

    # Check for an existing open or investigating alert for this rule and source_ip
    existing = db.execute(
        """
        SELECT id, event_count FROM alerts
        WHERE rule_id = ? AND (source_ip = ? OR (source_ip IS NULL AND ? IS NULL))
          AND status IN ('OPEN', 'INVESTIGATING')
          AND timestamp >= ?
        ORDER BY id DESC LIMIT 1
        """,
        (rule_id, source_ip, source_ip, cutoff)
    ).fetchone()

    details_json = json.dumps(details)

    if existing:
        alert_id = existing["id"]
        if event_count is not None:
            new_count = max(existing["event_count"] + 1, event_count)
        else:
            new_count = existing["event_count"] + 1
        db.execute(
            """
            UPDATE alerts
            SET timestamp = ?,
                event_count = ?,
                description = ?,
                details = ?,
                mitigation_hint = ?
            WHERE id = ?
            """,
            (now, new_count, description, details_json, mitigation_hint, alert_id)
        )
    else:
        initial_count = event_count if event_count is not None else 1
        cursor = db.execute(
            """
            INSERT INTO alerts (
                timestamp, rule_id, rule_name, severity, description,
                status, source_ip, destination_ip, event_count, details, mitigation_hint
            ) VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?)
            """,
            (now, rule_id, rule_name, severity, description, source_ip, destination_ip, initial_count, details_json, mitigation_hint)
        )
        alert_id = cursor.lastrowid

    # Retrieve and return the alert
    updated_row = db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    return row_to_alert(updated_row)


def evaluate_event(db: sqlite3.Connection, event: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Evaluate all detection rules against a newly ingested event and recent context.
    Returns a list of triggered alerts (new or updated).
    """
    triggered_alerts: List[Dict[str, Any]] = []
    source_ip = event.get("source_ip")
    destination_ip = event.get("destination_ip")
    event_type = (event.get("event_type") or "").strip().lower()
    message = (event.get("message") or "")
    raw_data_str = str(event.get("raw_data") or "")
    user = event.get("user")

    # 1. Rule: SSH Brute Force Authentication Attempt
    # >= 5 failed logins from the same source IP in the last 60 seconds
    if event_type == "login_failed" and source_ip:
        cutoff = _get_window_timestamp(60)
        row = db.execute(
            """
            SELECT COUNT(*) AS count FROM events
            WHERE source_ip = ? AND event_type = 'login_failed' AND timestamp >= ?
            """,
            (source_ip, cutoff)
        ).fetchone()

        fail_count = row["count"] if row else 1
        if fail_count >= 5:
            alert = _record_or_update_alert(
                db=db,
                rule_id="RULE_BRUTE_FORCE_AUTH",
                rule_name="SSH Brute Force Attempt",
                severity="HIGH",
                description=f"Detected {fail_count} failed login attempts from source IP {source_ip} within 60 seconds.",
                source_ip=source_ip,
                destination_ip=destination_ip,
                details={
                    "failed_attempts": fail_count,
                    "target_user": user,
                    "target_ip": destination_ip,
                    "triggering_event_id": event.get("id")
                },
                mitigation_hint="Temporarily rate-limit or block source IP, enforce MFA, and review authentication logs.",
                event_count=fail_count
            )
            triggered_alerts.append(alert)

    # 2. Rule: Port Scan Activity Detected
    # Distinct destination ports scanned from the same source IP >= 10 in 60 seconds
    if source_ip and (event_type in ("port_scan", "connection_attempt", "connection_failed") or event.get("destination_port") is not None):
        cutoff = _get_window_timestamp(60)
        row = db.execute(
            """
            SELECT COUNT(DISTINCT destination_port) AS port_count FROM events
            WHERE source_ip = ? AND destination_port IS NOT NULL AND timestamp >= ?
            """,
            (source_ip, cutoff)
        ).fetchone()

        port_count = row["port_count"] if row else 0
        if port_count >= 10:
            alert = _record_or_update_alert(
                db=db,
                rule_id="RULE_PORT_SCAN",
                rule_name="Network Port Scan Detected",
                severity="MEDIUM",
                description=f"Source IP {source_ip} probed {port_count} distinct destination ports within 60 seconds.",
                source_ip=source_ip,
                destination_ip=destination_ip,
                details={
                    "probed_ports_count": port_count,
                    "last_port": event.get("destination_port"),
                    "triggering_event_id": event.get("id")
                },
                mitigation_hint="Inspect firewall access controls, block scanner IP, and shut down unneeded listening services.",
                event_count=port_count
            )
            triggered_alerts.append(alert)

    # 3. Rule: Suspicious Login After Failed Attempts
    # Successful login following at least 3 failed login attempts for same IP and username within 5 minutes (300s)
    if event_type == "login_success" and source_ip and user:
        cutoff = _get_window_timestamp(300)
        row = db.execute(
            """
            SELECT COUNT(*) AS count FROM events
            WHERE source_ip = ? AND user = ? AND event_type = 'login_failed' AND timestamp >= ?
            """,
            (source_ip, user, cutoff)
        ).fetchone()

        failed_count = row["count"] if row else 0
        if failed_count >= 3:
            alert = _record_or_update_alert(
                db=db,
                rule_id="RULE_SUSPICIOUS_LOGIN",
                rule_name="Suspicious Login After Failed Attempts",
                severity="CRITICAL",
                description=f"Successful login for user '{user}' from IP {source_ip} following {failed_count} failed attempts within 5 minutes.",
                source_ip=source_ip,
                destination_ip=destination_ip,
                details={
                    "failed_attempts": failed_count,
                    "user": user,
                    "source_ip": source_ip,
                    "target_ip": destination_ip,
                    "triggering_event_id": event.get("id")
                },
                mitigation_hint="Verify user identity immediately, check for credential compromise, and revoke active sessions if unauthorized."
            )
            triggered_alerts.append(alert)

    # 4. Rule: Privilege Escalation Attempt
    # Triggered by explicit privilege_escalation event or suspicious sudo commands
    if event_type == "privilege_escalation" or (event_type == "suspicious_command" and "sudo" in message.lower()):
        alert = _record_or_update_alert(
            db=db,
            rule_id="RULE_PRIVILEGE_ESCALATION",
            rule_name="Unauthorized Privilege Escalation Attempt",
            severity="CRITICAL",
            description=f"Privilege escalation attempt detected for user '{user or 'unknown'}' from IP {source_ip or 'local'}.",
            source_ip=source_ip,
            destination_ip=destination_ip,
            details={
                "user": user,
                "command_or_message": message,
                "triggering_event_id": event.get("id")
            },
            mitigation_hint="Revoke active sessions, check /etc/sudoers, isolate host, and review auditd/auth.log."
        )
        triggered_alerts.append(alert)

    # 4. Rule: Malware / Ransomware Signature Detected
    if event_type in ("malware_detected", "ransomware_activity", "suspicious_process") or "malware" in message.lower():
        alert = _record_or_update_alert(
            db=db,
            rule_id="RULE_MALWARE_DETECTED",
            rule_name="Malware / Suspicious Process Detected",
            severity="CRITICAL",
            description=f"Malicious process or artifact identified on {destination_ip or source_ip or 'endpoint'}: {message}.",
            source_ip=source_ip,
            destination_ip=destination_ip,
            details={
                "message": message,
                "event_type": event_type,
                "triggering_event_id": event.get("id")
            },
            mitigation_hint="Isolate endpoint from the network segment immediately, capture memory dump, and execute EDR quarantine."
        )
        triggered_alerts.append(alert)

    # 5. Rule: DDoS / Volumetric Flood Spike
    # >= 15 requests from single source IP in 60s or event_type == ddos_flood
    if source_ip and (event_type == "ddos_flood" or event.get("severity") in ("HIGH", "CRITICAL")):
        cutoff = _get_window_timestamp(60)
        row = db.execute(
            """
            SELECT COUNT(*) AS count FROM events
            WHERE source_ip = ? AND timestamp >= ?
            """,
            (source_ip, cutoff)
        ).fetchone()

        volume = row["count"] if row else 1
        if volume >= 15 or event_type == "ddos_flood":
            alert = _record_or_update_alert(
                db=db,
                rule_id="RULE_DDOS_FLOOD",
                rule_name="Denial of Service Traffic Spike",
                severity="HIGH",
                description=f"High-frequency request spike ({volume} events in 60s) from source IP {source_ip}.",
                source_ip=source_ip,
                destination_ip=destination_ip,
                details={
                    "request_volume_60s": volume,
                    "target_ip": destination_ip,
                    "triggering_event_id": event.get("id")
                },
                mitigation_hint="Enable rate-limiting, activate Cloud/WAF anti-DDoS mitigations, or null-route malicious traffic.",
                event_count=volume
            )
            triggered_alerts.append(alert)

    # 6. Rule: SQL Injection (SQLi) Attempt
    sqli_signatures = ["' or '1'='1", "union select", "drop table", "information_schema", ";--", "sleep("]
    combined_content = f"{message} {raw_data_str}".lower()
    if event_type == "sql_injection" or any(sig in combined_content for sig in sqli_signatures):
        alert = _record_or_update_alert(
            db=db,
            rule_id="RULE_SQL_INJECTION",
            rule_name="SQL Injection Attack Attempt",
            severity="HIGH",
            description=f"SQL injection attack vector detected from source IP {source_ip or 'unknown'}.",
            source_ip=source_ip,
            destination_ip=destination_ip,
            details={
                "payload_snippet": message[:100],
                "triggering_event_id": event.get("id")
            },
            mitigation_hint="Enforce parameterized SQL queries, sanitize inputs, and verify WAF SQLi filter rules."
        )
        triggered_alerts.append(alert)

    # Commit any alerts generated or updated
    if triggered_alerts:
        db.commit()

    return triggered_alerts


def run_all_rules(db: sqlite3.Connection) -> List[Dict[str, Any]]:
    """
    Run detection engine retroactively over recent unprocessed events.
    Useful for batch ingestion, historical analysis, or test verification.
    """
    cutoff = _get_window_timestamp(600)
    events = db.execute(
        "SELECT * FROM events WHERE timestamp >= ? ORDER BY id ASC",
        (cutoff,)
    ).fetchall()

    all_alerts: List[Dict[str, Any]] = []
    for ev_row in events:
        ev_dict = dict(ev_row)
        alerts = evaluate_event(db, ev_dict)
        all_alerts.extend(alerts)

    return all_alerts
