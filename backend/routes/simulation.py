from datetime import datetime, timedelta, timezone
import json
import random
from flask import Blueprint, request, jsonify

from database import get_db, execute_db, query_db
from detection.engine import evaluate_event
from models import error_response, get_utc_now_iso

simulate_bp = Blueprint("simulate", __name__, url_prefix="/api/simulate")
simulation_bp = Blueprint("simulation", __name__, url_prefix="/api/simulation")

SCENARIOS = {
    "brute_force": {
        "id": "brute_force",
        "name": "SSH / Web Authentication Brute Force",
        "description": "Simulates 6 rapid failed login attempts against root/admin from an external attacker IP within 60 seconds, triggering the High-severity Brute Force detection rule.",
        "category": "Credential Access",
        "mitre_id": "T1110",
        "default_count": 6
    },
    "port_scan": {
        "id": "port_scan",
        "name": "Network Reconnaissance Port Scan",
        "description": "Simulates an external host probing 11 distinct destination ports within 60 seconds, triggering the Medium-severity Port Scan detection rule.",
        "category": "Reconnaissance",
        "mitre_id": "T1046",
        "default_count": 11
    },
    "suspicious_login": {
        "id": "suspicious_login",
        "name": "Suspicious Login Following Failed Attempts",
        "description": "Simulates 3 failed login attempts followed by a successful login for the same user and IP within 5 minutes, triggering the Critical-severity Suspicious Login detection rule.",
        "category": "Credential Access",
        "mitre_id": "T1078",
        "default_count": 4
    },
    "privilege_escalation": {
        "id": "privilege_escalation",
        "name": "Unauthorized Privilege Escalation",
        "description": "Simulates an unprivileged user exploiting sudo rights or setuid binaries to attain root privileges.",
        "category": "Privilege Escalation",
        "mitre_id": "T1068",
        "default_count": 2
    },
    "malware_infection": {
        "id": "malware_infection",
        "name": "Ransomware / Malware Execution",
        "description": "Simulates a suspicious binary execution beaconing to command-and-control infrastructure.",
        "category": "Execution & C2",
        "mitre_id": "T1204",
        "default_count": 2
    },
    "ddos_flood": {
        "id": "ddos_flood",
        "name": "Volumetric Denial of Service Flood",
        "description": "Simulates a sudden flood of 18 rapid connection requests from a single external IP.",
        "category": "Impact",
        "mitre_id": "T1499",
        "default_count": 18
    },
    "sql_injection": {
        "id": "sql_injection",
        "name": "SQL Injection (SQLi) Web Attack",
        "description": "Simulates malicious web payloads targeting user login forms and database endpoints.",
        "category": "Initial Access",
        "mitre_id": "T1190",
        "default_count": 3
    },
    "normal_traffic": {
        "id": "normal_traffic",
        "name": "Benign Baseline Traffic",
        "description": "Simulates routine benign events: successful web requests, authorized logins, and DNS lookups.",
        "category": "Routine Operations",
        "mitre_id": "N/A",
        "default_count": 10
    }
}


def _create_and_ingest_event(db, ev_data):
    """Helper to insert an event and evaluate rules."""
    ts = ev_data.get("timestamp") or get_utc_now_iso()
    raw = ev_data.get("raw_data")
    if raw is not None and not isinstance(raw, str):
        raw = json.dumps(raw)

    cur = db.execute(
        """
        INSERT INTO events (
            timestamp, source_ip, destination_ip, source_port, destination_port,
            protocol, event_type, severity, user, message, raw_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ts,
            ev_data.get("source_ip"),
            ev_data.get("destination_ip"),
            ev_data.get("source_port"),
            ev_data.get("destination_port"),
            ev_data.get("protocol", "TCP"),
            ev_data.get("event_type"),
            ev_data.get("severity", "INFO"),
            ev_data.get("user"),
            ev_data.get("message"),
            raw
        )
    )
    db.commit()
    ev_id = cur.lastrowid
    row = query_db("SELECT * FROM events WHERE id = ?", (ev_id,), one=True)
    ev_dict = dict(row)
    alerts = evaluate_event(db, ev_dict)
    return ev_dict, alerts


def _execute_scenario_core(scenario_id: str):
    """Core execution logic for all simulation scenarios."""
    db = get_db()
    now = datetime.now(timezone.utc)
    events_generated = 0
    all_triggered_alerts = []

    if scenario_id == "brute_force":
        attacker_ip = "198.51.100.44"
        target_ip = "10.0.0.5"
        users = ["admin", "root", "oracle", "administrator", "deploy", "root"]
        for i, user in enumerate(users):
            # All 6 attempts generated within 25 seconds (well within 60s rule)
            ev_time = (now - timedelta(seconds=(len(users) - i) * 4)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": attacker_ip,
                "destination_ip": target_ip,
                "source_port": 45000 + i,
                "destination_port": 22,
                "protocol": "TCP",
                "event_type": "login_failed",
                "severity": "MEDIUM",
                "user": user,
                "message": f"Failed password authentication attempt for user '{user}' from {attacker_ip} port {45000 + i} ssh2",
                "raw_data": {"service": "sshd", "auth_method": "password"}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    elif scenario_id == "port_scan":
        scanner_ip = "203.0.113.88"
        target_ip = "10.0.0.10"
        # 11 distinct ports (satisfies >= 10 within 60s)
        ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 8080]
        for i, port in enumerate(ports):
            ev_time = (now - timedelta(seconds=(len(ports) - i) * 2)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": scanner_ip,
                "destination_ip": target_ip,
                "source_port": 52000 + i,
                "destination_port": port,
                "protocol": "TCP",
                "event_type": "port_scan",
                "severity": "MEDIUM",
                "user": None,
                "message": f"TCP SYN packet sent to {target_ip}:{port} (RST/ACK received)",
                "raw_data": {"scan_type": "SYN_SCAN", "flag": "SYN"}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    elif scenario_id == "suspicious_login":
        attacker_ip = "198.51.100.77"
        target_ip = "10.0.0.5"
        user = "sec_admin"
        # 3 failed logins followed by a successful login for the same user & IP within 5 minutes
        steps = [
            ("login_failed", "HIGH", 45, "Failed SSH password attempt 1/3 for user 'sec_admin'"),
            ("login_failed", "HIGH", 30, "Failed SSH password attempt 2/3 for user 'sec_admin'"),
            ("login_failed", "HIGH", 15, "Failed SSH password attempt 3/3 for user 'sec_admin'"),
            ("login_success", "CRITICAL", 2, "Successful SSH login for user 'sec_admin' following 3 failed attempts")
        ]
        for ev_type, sev, sec_ago, msg in steps:
            ev_time = (now - timedelta(seconds=sec_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": attacker_ip,
                "destination_ip": target_ip,
                "source_port": 49200,
                "destination_port": 22,
                "protocol": "TCP",
                "event_type": ev_type,
                "severity": sev,
                "user": user,
                "message": msg,
                "raw_data": {"auth_stage": ev_type, "target_user": user}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    elif scenario_id == "privilege_escalation":
        attacker_ip = "10.0.0.102"
        target_ip = "10.0.0.15"
        steps = [
            ("login_success", "LOW", "dev_user", "User dev_user logged into shell session via SSH", 22),
            ("privilege_escalation", "CRITICAL", "dev_user", "Suspicious execution: sudo /bin/bash via vulnerable pkexec helper", None)
        ]
        for i, (ev_type, sev, u, msg, port) in enumerate(steps):
            ev_time = (now - timedelta(seconds=(len(steps) - i) * 15)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": attacker_ip,
                "destination_ip": target_ip,
                "source_port": 49152 + i,
                "destination_port": port,
                "protocol": "TCP",
                "event_type": ev_type,
                "severity": sev,
                "user": u,
                "message": msg,
                "raw_data": {"mitre": "T1068", "binary": "pkexec"}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    elif scenario_id == "malware_infection":
        compromised_ip = "10.0.0.45"
        c2_ip = "185.220.101.5"
        steps = [
            ("file_access", "MEDIUM", "finance_user", "Suspicious invoice.exe downloaded to %TEMP% folder", None),
            ("malware_detected", "CRITICAL", "SYSTEM", "Ransomware signature detected: Encryptor.WannaCrypt beacon to C2 IP 185.220.101.5", 4444)
        ]
        for i, (ev_type, sev, u, msg, port) in enumerate(steps):
            ev_time = (now - timedelta(seconds=(len(steps) - i) * 10)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": compromised_ip,
                "destination_ip": c2_ip,
                "source_port": 50000 + i,
                "destination_port": port,
                "protocol": "TCP",
                "event_type": ev_type,
                "severity": sev,
                "user": u,
                "message": msg,
                "raw_data": {"sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    elif scenario_id == "ddos_flood":
        flooder_ip = "192.0.2.77"
        target_ip = "10.0.0.1"
        for i in range(16):
            ev_time = (now - timedelta(seconds=(16 - i) * 2)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": flooder_ip,
                "destination_ip": target_ip,
                "source_port": 30000 + i,
                "destination_port": 80,
                "protocol": "TCP",
                "event_type": "ddos_flood",
                "severity": "HIGH",
                "user": None,
                "message": f"HTTP GET /api/data flood request #{i+1} from {flooder_ip}",
                "raw_data": {"rate_per_sec": 120}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    elif scenario_id == "sql_injection":
        attacker_ip = "203.0.113.19"
        target_ip = "10.0.0.8"
        payloads = [
            "GET /products?id=1' OR '1'='1' HTTP/1.1 - Malicious query parameter",
            "POST /login user=admin' UNION SELECT null, username, password FROM users--",
            "GET /search?q=test'; DROP TABLE audit_log;-- HTTP/1.1"
        ]
        for i, payload in enumerate(payloads):
            ev_time = (now - timedelta(seconds=(len(payloads) - i) * 10)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": attacker_ip,
                "destination_ip": target_ip,
                "source_port": 40100 + i,
                "destination_port": 443,
                "protocol": "HTTPS",
                "event_type": "sql_injection",
                "severity": "HIGH",
                "user": "anonymous",
                "message": payload,
                "raw_data": {"uri": "/login", "payload": payload}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    elif scenario_id == "normal_traffic":
        samples = [
            ("login_success", "INFO", "alice", "Successful password login via Web portal", "192.168.1.50", "10.0.0.5", 443),
            ("file_access", "INFO", "bob", "Read access granted to /shared/documents/spec.pdf", "192.168.1.55", "10.0.0.12", 445),
            ("dns_query", "INFO", None, "DNS query resolved for api.internal.local (10.0.0.8)", "192.168.1.60", "10.0.0.2", 53),
            ("http_request", "INFO", "carol", "GET /dashboard HTTP/2 200 OK", "192.168.1.75", "10.0.0.8", 443),
            ("login_success", "INFO", "david", "SSH session opened with public key", "192.168.1.80", "10.0.0.15", 22)
        ]
        for i, (ev_type, sev, u, msg, s_ip, d_ip, port) in enumerate(samples):
            ev_time = (now - timedelta(seconds=(len(samples) - i) * 30)).strftime("%Y-%m-%dT%H:%M:%SZ")
            ev_data = {
                "timestamp": ev_time,
                "source_ip": s_ip,
                "destination_ip": d_ip,
                "source_port": 55000 + i,
                "destination_port": port,
                "protocol": "TCP",
                "event_type": ev_type,
                "severity": sev,
                "user": u,
                "message": msg,
                "raw_data": {"status": 200}
            }
            _, alerts = _create_and_ingest_event(db, ev_data)
            events_generated += 1
            all_triggered_alerts.extend(alerts)

    return jsonify({
        "message": f"Simulation scenario '{scenario_id}' executed successfully",
        "scenario": SCENARIOS[scenario_id],
        "events_generated": events_generated,
        "alerts_triggered": all_triggered_alerts
    }), 200


def _handle_scenario_route(scenario_id: str):
    """Validate scenario name and execute."""
    scenario_clean = str(scenario_id).strip().lower()
    if scenario_clean not in SCENARIOS:
        return error_response(
            f"Unknown scenario '{scenario_clean}'. Available: {sorted(list(SCENARIOS.keys()))}",
            400,
            "INVALID_SCENARIO"
        )
    return _execute_scenario_core(scenario_clean)


# Primary contract routes under /api/simulate
@simulate_bp.route("/<scenario>", methods=["POST"])
def simulate_scenario(scenario: str):
    """Execute a specific simulation scenario via POST /api/simulate/<scenario>."""
    return _handle_scenario_route(scenario)


@simulate_bp.route("/scenarios", methods=["GET"])
def list_scenarios_simulate():
    """List available educational simulation scenarios."""
    return jsonify({"scenarios": list(SCENARIOS.values())}), 200


@simulate_bp.route("/reset", methods=["POST"])
def reset_siem_simulate():
    """Reset both events and alerts tables completely."""
    return _reset_tables()


@simulate_bp.route("/seed", methods=["POST"])
def seed_baseline_simulate():
    """Seed the database with sample baseline data."""
    return _seed_data()


# Backward-compatible runner for legacy clients
@simulation_bp.route("/run", methods=["POST"])
def run_simulation_legacy():
    """Legacy runner via POST /api/simulation/run with optional JSON body {"scenario": ...}."""
    data = request.get_json(silent=True) or {}
    scenario_id = str(data.get("scenario", "brute_force")).strip().lower()
    return _handle_scenario_route(scenario_id)


def _reset_tables():
    execute_db("DELETE FROM alerts")
    execute_db("DELETE FROM events")
    return jsonify({
        "message": "SIEM database reset successfully (events and alerts cleared)"
    }), 200


def _seed_data():
    db = get_db()
    now = datetime.now(timezone.utc)

    # 1. Benign background events spread across last 24 hours
    benign_ips = ["192.168.1.10", "192.168.1.25", "192.168.1.50", "10.0.1.15", "10.0.1.20"]
    servers = [("10.0.0.5", 443, "HTTPS"), ("10.0.0.8", 80, "HTTP"), ("10.0.0.2", 53, "DNS"), ("10.0.0.15", 22, "SSH")]
    users = ["alice", "bob", "charlie", "dana", "edward"]

    seeded_events = 0
    for hour in range(24, 0, -1):
        for _ in range(random.randint(3, 6)):
            event_dt = now - timedelta(hours=hour, minutes=random.randint(0, 59), seconds=random.randint(0, 59))
            srv_ip, srv_port, proto = random.choice(servers)
            u = random.choice(users)
            s_ip = random.choice(benign_ips)
            ev_type = "http_request" if srv_port in (80, 443) else ("login_success" if srv_port == 22 else "dns_query")
            msg = f"{proto} transaction to {srv_ip}:{srv_port} completed normally"

            db.execute(
                """
                INSERT INTO events (
                    timestamp, source_ip, destination_ip, source_port, destination_port,
                    protocol, event_type, severity, user, message, raw_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'INFO', ?, ?, ?)
                """,
                (
                    event_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    s_ip,
                    srv_ip,
                    random.randint(30000, 60000),
                    srv_port,
                    proto,
                    ev_type,
                    u,
                    msg,
                    json.dumps({"status": "OK", "code": 200})
                )
            )
            seeded_events += 1

    db.commit()

    # 2. Run sample attack simulations to generate realistic alerts
    run_simulation_helper(db, "brute_force")
    run_simulation_helper(db, "port_scan")
    run_simulation_helper(db, "suspicious_login")

    total_events = query_db("SELECT COUNT(*) AS c FROM events", one=True)["c"]
    total_alerts = query_db("SELECT COUNT(*) AS c FROM alerts", one=True)["c"]

    return jsonify({
        "message": "Database seeded with realistic baseline SIEM data",
        "total_events": total_events,
        "total_alerts": total_alerts
    }), 201


def run_simulation_helper(db, scenario_id: str):
    """Internal helper to execute a scenario without HTTP request."""
    now = datetime.now(timezone.utc)
    if scenario_id == "brute_force":
        attacker_ip = "198.51.100.44"
        target_ip = "10.0.0.5"
        for i, u in enumerate(["admin", "root", "guest", "ubuntu", "sysadmin", "root"]):
            ev_time = (now - timedelta(seconds=(6 - i) * 4)).strftime("%Y-%m-%dT%H:%M:%SZ")
            _create_and_ingest_event(db, {
                "timestamp": ev_time,
                "source_ip": attacker_ip,
                "destination_ip": target_ip,
                "source_port": 45000 + i,
                "destination_port": 22,
                "protocol": "TCP",
                "event_type": "login_failed",
                "severity": "HIGH",
                "user": u,
                "message": f"Failed password for user '{u}' from {attacker_ip} port {45000 + i}",
                "raw_data": {"auth": "failed"}
            })
    elif scenario_id == "port_scan":
        scanner_ip = "203.0.113.88"
        target_ip = "10.0.0.10"
        for i, p in enumerate([21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 8080]):
            ev_time = (now - timedelta(seconds=(11 - i) * 2)).strftime("%Y-%m-%dT%H:%M:%SZ")
            _create_and_ingest_event(db, {
                "timestamp": ev_time,
                "source_ip": scanner_ip,
                "destination_ip": target_ip,
                "source_port": 51000 + i,
                "destination_port": p,
                "protocol": "TCP",
                "event_type": "port_scan",
                "severity": "MEDIUM",
                "user": None,
                "message": f"Port probe on port {p}",
                "raw_data": {"syn": True}
            })
    elif scenario_id == "suspicious_login":
        attacker_ip = "198.51.100.77"
        target_ip = "10.0.0.5"
        user = "sec_admin"
        steps = [
            ("login_failed", "HIGH", 45, "Failed SSH password attempt 1/3 for user 'sec_admin'"),
            ("login_failed", "HIGH", 30, "Failed SSH password attempt 2/3 for user 'sec_admin'"),
            ("login_failed", "HIGH", 15, "Failed SSH password attempt 3/3 for user 'sec_admin'"),
            ("login_success", "CRITICAL", 2, "Successful SSH login for user 'sec_admin' following 3 failed attempts")
        ]
        for ev_type, sev, sec_ago, msg in steps:
            ev_time = (now - timedelta(seconds=sec_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")
            _create_and_ingest_event(db, {
                "timestamp": ev_time,
                "source_ip": attacker_ip,
                "destination_ip": target_ip,
                "source_port": 49200,
                "destination_port": 22,
                "protocol": "TCP",
                "event_type": ev_type,
                "severity": sev,
                "user": user,
                "message": msg,
                "raw_data": {"auth_stage": ev_type, "target_user": user}
            })
    elif scenario_id == "privilege_escalation":
        attacker_ip = "10.0.0.102"
        target_ip = "10.0.0.15"
        _create_and_ingest_event(db, {
            "timestamp": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source_ip": attacker_ip,
            "destination_ip": target_ip,
            "source_port": 48200,
            "destination_port": 22,
            "protocol": "TCP",
            "event_type": "privilege_escalation",
            "severity": "CRITICAL",
            "user": "restricted_svc",
            "message": "User restricted_svc escalated to root via sudo setuid execution",
            "raw_data": {"cve": "CVE-2021-4034"}
        })
