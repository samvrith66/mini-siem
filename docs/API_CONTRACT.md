Mini-SIEM Backend — Frontend Integration Contract

This API contract is derived directly from the source code in /home/shikz/mini-siem/backend.

1. Global Specifications & Standards
1.1 Base URL & CORS Configuration
Base URL: http://localhost:5000 (or http://127.0.0.1:5000)
Allowed Frontend Origins: http://localhost:5173 and http://127.0.0.1:5173
Supported Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed Headers: Content-Type, Authorization
Credentials: supports_credentials=True
1.2 Timestamps
All timestamps returned by the API are in UTC ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ (e.g., "2026-11-01T09:12:00Z").
In POST /api/events, the timestamp field is optional. If omitted or null, the backend generates the current UTC timestamp automatically.
1.3 Error Response Format

All 4xx and 5xx error responses return a standardized JSON structure:

json
{
  "error": "STRING_ERROR_CODE",
  "message": "Human-readable explanation of error.",
  "status_code": 400,
  "timestamp": "2026-11-01T09:12:00Z"
}

Optional details key may be present on specific validation failures.

Common Error Codes:

BAD_REQUEST (400): Malformed JSON, non-integer port, or invalid status/severity filter.
MISSING_FIELD (400): Required field missing in POST /api/events.
INVALID_SCENARIO (400): Unrecognized scenario name in POST /api/simulate/<scenario>.
NOT_FOUND (404): Resource or URL does not exist.
EVENT_NOT_FOUND (404): Event ID not found in database.
ALERT_NOT_FOUND (404): Alert ID not found in database.
METHOD_NOT_ALLOWED (405): Disallowed HTTP method.
INTERNAL_SERVER_ERROR / DATABASE_ERROR (500): Internal failure.
2. Enumerations & Data Types
2.1 Severities

Defined in backend/models.py:

INFO
LOW
MEDIUM
HIGH
CRITICAL
2.2 Alert Statuses

Defined in backend/models.py:

OPEN (Default for newly generated alerts)
INVESTIGATING
RESOLVED
FALSE_POSITIVE
CLOSED
2.3 Event Types

Any non-empty string is accepted upon ingestion, but the detection engine correlates these specific types:

login_failed, login_success
port_scan, connection_attempt, connection_failed
http_request, dns_query, file_access
privilege_escalation, suspicious_command
malware_detected, ransomware_activity, suspicious_process
ddos_flood, sql_injection
2.4 Simulation Scenarios

The supported scenario keys for POST /api/simulate/<scenario> are:

brute_force (SSH/Web Failed Authentication Brute Force)
port_scan (Multi-Port Network Reconnaissance)
suspicious_login (Failed Logins followed by Successful Authentication)
privilege_escalation (Unauthorized privilege escalation / sudo exploit)
malware_infection (Ransomware execution signature / C2 beacon)
ddos_flood (Volumetric HTTP/TCP request flood)
sql_injection (SQL injection attack vector payload)
normal_traffic (Benign baseline user and service traffic)
3. Detailed Endpoint Contracts
3.1 Health Check — GET /api/health

Checks whether the Flask backend and SQLite database are operational.

Method: GET
Path: /api/health
Query Parameters: None
Request Body: None
Response (200 OK):
json
{
  "status": "operational",
  "service": "Mini-SIEM Backend",
  "database": "operational",
  "timestamp": "2026-11-01T09:12:00Z",
  "blueprints": [
    "events (/api/events)",
    "alerts (/api/alerts)",
    "stats (/api/stats)",
    "simulate (/api/simulate/<scenario>)",
    "simulation (/api/simulation/run)"
  ]
}
Error Response (503 Service Unavailable): If the SQLite connection fails:
json
{
  "status": "degraded",
  "service": "Mini-SIEM Backend",
  "database": "error: database is locked",
  "timestamp": "2026-11-01T09:12:00Z",
  "blueprints": [...]
}
3.2 Ingest Event — POST /api/events

Submits a security event, persists it to SQLite, and runs the detection engine.

Method: POST

Path: /api/events

Query Parameters: None

Request Headers: Content-Type: application/json

Request JSON:

Field	Type	Required?	Description
event_type	string	Yes	Cannot be empty or whitespace
source_ip	string	Yes	Cannot be empty or whitespace
destination_ip	string | null	No	Optional destination IP
source_port	integer | null	No	Must be integer if provided
destination_port	integer | null	No	Must be integer if provided
protocol	string	No	Defaults to "TCP"
severity	string	No	Defaults to "INFO"; must be valid severity
timestamp	string	No	ISO 8601 string; auto-generated if omitted
user	string | null	No	Username associated with event
message	string	No	Descriptive log message, defaults to ""
raw_data	object | string | null	No	JSON object or string with raw event details
json
{
  "event_type": "login_failed",
  "source_ip": "198.51.100.44",
  "destination_ip": "10.0.0.5",
  "source_port": 45000,
  "destination_port": 22,
  "protocol": "TCP",
  "severity": "HIGH",
  "user": "admin",
  "message": "Failed password authentication attempt for user 'admin'",
  "raw_data": { "service": "sshd", "auth_method": "password" }
}

Response (201 Created):

json
{
  "message": "Event recorded successfully",
  "event": {
    "id": 1,
    "timestamp": "2026-11-01T09:12:00Z",
    "source_ip": "198.51.100.44",
    "destination_ip": "10.0.0.5",
    "source_port": 45000,
    "destination_port": 22,
    "protocol": "TCP",
    "event_type": "login_failed",
    "severity": "HIGH",
    "user": "admin",
    "message": "Failed password authentication attempt for user 'admin'",
    "raw_data": { "service": "sshd", "auth_method": "password" }
  },
  "triggered_alerts": [
    {
      "id": 1,
      "timestamp": "2026-11-01T09:12:00Z",
      "rule_id": "RULE_BRUTE_FORCE_AUTH",
      "rule_name": "SSH Brute Force Attempt",
      "severity": "HIGH",
      "description": "Detected 5 failed login attempts from source IP 198.51.100.44 within 60 seconds.",
      "status": "OPEN",
      "source_ip": "198.51.100.44",
      "destination_ip": "10.0.0.5",
      "event_count": 5,
      "details": {
        "failed_attempts": 5,
        "target_user": "admin",
        "target_ip": "10.0.0.5",
        "triggering_event_id": 1
      },
      "mitigation_hint": "Temporarily rate-limit or block source IP, enforce MFA, and review authentication logs."
    }
  ]
}

Error Responses:

400 BAD_REQUEST: Missing/invalid JSON body.
400 MISSING_FIELD: Missing event_type or source_ip.
400 BAD_REQUEST: Non-integer source_port or destination_port.
3.3 List Events — GET /api/events

Retrieves paginated events ordered reverse-chronologically (ORDER BY timestamp DESC, id DESC).

Method: GET

Path: /api/events

Query Parameters:

Parameter	Type	Default	Description
limit	integer	50	Maximum items to return (min 1, max 500)
offset	integer	0	Zero-indexed offset
severity	string	None	Filter by INFO, LOW, MEDIUM, HIGH, CRITICAL
event_type	string	None	Exact match on event type
source_ip	string	None	Exact match on source IP
destination_ip	string	None	Exact match on destination IP
user	string	None	Exact match on user
search	string	None	Case-insensitive substring match in message, user, or IPs
start_time	string	None	ISO 8601 timestamp cutoff (timestamp >= start_time)
end_time	string	None	ISO 8601 timestamp cutoff (timestamp <= end_time)

Response (200 OK):

json
{
  "events": [
    {
      "id": 10,
      "timestamp": "2026-11-01T09:12:00Z",
      "source_ip": "198.51.100.44",
      "destination_ip": "10.0.0.5",
      "source_port": 45000,
      "destination_port": 22,
      "protocol": "TCP",
      "event_type": "login_failed",
      "severity": "HIGH",
      "user": "admin",
      "message": "Failed password attempt",
      "raw_data": { "service": "sshd" }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}

Error Responses:

400 BAD_REQUEST: limit or offset not integers.
400 BAD_REQUEST: Invalid severity string.
3.4 List Alerts — GET /api/alerts

Retrieves paginated alerts ordered reverse-chronologically (ORDER BY timestamp DESC, id DESC).

Method: GET

Path: /api/alerts

Query Parameters:

Parameter	Type	Default	Description
limit	integer	50	Maximum items to return (min 1, max 500)
offset	integer	0	Zero-indexed offset
status	string	None	OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE, CLOSED
severity	string	None	LOW, MEDIUM, HIGH, CRITICAL
rule_id	string	None	Exact match (e.g. RULE_BRUTE_FORCE_AUTH)
source_ip	string	None	Exact match on source IP

Response (200 OK):

json
{
  "alerts": [
    {
      "id": 1,
      "timestamp": "2026-11-01T09:12:00Z",
      "rule_id": "RULE_BRUTE_FORCE_AUTH",
      "rule_name": "SSH Brute Force Attempt",
      "severity": "HIGH",
      "description": "Detected 5 failed login attempts from source IP 198.51.100.44 within 60 seconds.",
      "status": "OPEN",
      "source_ip": "198.51.100.44",
      "destination_ip": "10.0.0.5",
      "event_count": 5,
      "details": {
        "failed_attempts": 5,
        "target_user": "admin"
      },
      "mitigation_hint": "Temporarily rate-limit or block source IP, enforce MFA, and review authentication logs."
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}

Error Responses:

400 BAD_REQUEST: Invalid status or severity filter value.
3.5 Update Alert Status — PATCH /api/alerts/<int:alert_id>

Updates an alert's status, analyst notes, or mitigation hints.

Method: PATCH (also accepts PUT)

Path: /api/alerts/{id} (e.g. /api/alerts/1)

Request Headers: Content-Type: application/json

Request JSON:

Field	Type	Required?	Allowed Values
status	string	No*	"OPEN", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE", "CLOSED"
mitigation_hint	string	No*	SOC analyst remediation guidance
details	object | string	No*	Additional notes/metadata

*At least one of status, mitigation_hint, or details must be provided.

json
{
  "status": "INVESTIGATING",
  "mitigation_hint": "IP blocked on perimeter firewall",
  "details": { "assigned_analyst": "analyst_1", "ticket_id": "SOC-841" }
}

Response (200 OK):

json
{
  "message": "Alert updated successfully",
  "alert": {
    "id": 1,
    "timestamp": "2026-11-01T09:12:00Z",
    "rule_id": "RULE_BRUTE_FORCE_AUTH",
    "rule_name": "SSH Brute Force Attempt",
    "severity": "HIGH",
    "status": "INVESTIGATING",
    "source_ip": "198.51.100.44",
    "destination_ip": "10.0.0.5",
    "event_count": 5,
    "details": {
      "assigned_analyst": "analyst_1",
      "ticket_id": "SOC-841"
    },
    "mitigation_hint": "IP blocked on perimeter firewall"
  }
}

Error Responses:

400 BAD_REQUEST: Invalid status value (must be one of the allowed values).
400 BAD_REQUEST: No valid fields provided.
404 NOT_FOUND (ALERT_NOT_FOUND): Alert ID does not exist.
3.6 Dashboard Statistics — GET /api/stats

Returns aggregated metrics for top-level SOC dashboard KPI cards and charts.

Method: GET
Path: /api/stats
Query Parameters: None
Request Body: None
Response (200 OK):
json
{
  "total_events": 142,
  "events_last_24h": 142,
  "total_alerts": 3,
  "alerts_last_24h": 3,
  "open_alerts": 2,
  "investigating_alerts": 1,
  "resolved_alerts": 0,
  "critical_alerts": 1,
  "high_alerts": 1,
  "severity_distribution": {
    "events": {
      "CRITICAL": 1,
      "HIGH": 6,
      "INFO": 120,
      "LOW": 2,
      "MEDIUM": 13
    },
    "alerts": {
      "CRITICAL": 1,
      "HIGH": 1,
      "LOW": 0,
      "MEDIUM": 1
    }
  }
}
3.7 List Simulation Scenarios — GET /api/simulate/scenarios

Lists all available pre-programmed attack simulations.

Method: GET
Path: /api/simulate/scenarios
Query Parameters: None
Request Body: None
Response (200 OK):
json
{
  "scenarios": [
    {
      "id": "brute_force",
      "name": "SSH / Web Authentication Brute Force",
      "category": "Credential Access",
      "mitre_id": "T1110",
      "default_count": 6,
      "description": "Simulates 6 rapid failed login attempts against root/admin from an external attacker IP within 60 seconds, triggering the High-severity Brute Force detection rule."
    },
    {
      "id": "port_scan",
      "name": "Network Reconnaissance Port Scan",
      "category": "Reconnaissance",
      "mitre_id": "T1046",
      "default_count": 11,
      "description": "Simulates an external host probing 11 distinct destination ports within 60 seconds, triggering the Medium-severity Port Scan detection rule."
    },
    {
      "id": "suspicious_login",
      "name": "Suspicious Login Following Failed Attempts",
      "category": "Credential Access",
      "mitre_id": "T1078",
      "default_count": 4,
      "description": "Simulates 3 failed login attempts followed by a successful login for the same user and IP within 5 minutes, triggering the Critical-severity Suspicious Login detection rule."
    },
    {
      "id": "privilege_escalation",
      "name": "Unauthorized Privilege Escalation",
      "category": "Privilege Escalation",
      "mitre_id": "T1068",
      "default_count": 2,
      "description": "Simulates an unprivileged user exploiting sudo rights or setuid binaries to attain root privileges."
    },
    {
      "id": "malware_infection",
      "name": "Ransomware / Malware Execution",
      "category": "Execution & C2",
      "mitre_id": "T1204",
      "default_count": 2,
      "description": "Simulates a suspicious binary execution beaconing to command-and-control infrastructure."
    },
    {
      "id": "ddos_flood",
      "name": "Volumetric Denial of Service Flood",
      "category": "Impact",
      "mitre_id": "T1499",
      "default_count": 18,
      "description": "Simulates a sudden flood of 18 rapid connection requests from a single external IP."
    },
    {
      "id": "sql_injection",
      "name": "SQL Injection (SQLi) Web Attack",
      "category": "Initial Access",
      "mitre_id": "T1190",
      "default_count": 3,
      "description": "Simulates malicious web payloads targeting user login forms and database endpoints."
    },
    {
      "id": "normal_traffic",
      "name": "Benign Baseline Traffic",
      "category": "Routine Operations",
      "mitre_id": "N/A",
      "default_count": 10,
      "description": "Simulates routine benign events: successful web requests, authorized logins, and DNS lookups."
    }
  ]
}
3.8 Execute Simulation — POST /api/simulate/<scenario>

Executes an attack simulation scenario. Ingests simulated events into the database and triggers corresponding detection rules.

Method: POST
Path: /api/simulate/{scenario} (e.g. /api/simulate/brute_force, /api/simulate/port_scan, /api/simulate/suspicious_login)
Query Parameters: None
Request Body: Empty or {} (No request body is required). The scenario is passed in the URL path.
Response (200 OK):
json
{
  "message": "Simulation scenario 'suspicious_login' executed successfully",
  "scenario": {
    "id": "suspicious_login",
    "name": "Suspicious Login Following Failed Attempts",
    "category": "Credential Access",
    "mitre_id": "T1078",
    "default_count": 4,
    "description": "Simulates 3 failed login attempts followed by a successful login for the same user and IP within 5 minutes, triggering the Critical-severity Suspicious Login detection rule."
  },
  "events_generated": 4,
  "alerts_triggered": [
    {
      "id": 1,
      "timestamp": "2026-11-01T09:12:00Z",
      "rule_id": "RULE_SUSPICIOUS_LOGIN",
      "rule_name": "Suspicious Login After Failed Attempts",
      "severity": "CRITICAL",
      "description": "Successful login for user 'sec_admin' from IP 198.51.100.77 following 3 failed attempts within 5 minutes.",
      "status": "OPEN",
      "source_ip": "198.51.100.77",
      "destination_ip": "10.0.0.5",
      "event_count": 1,
      "details": {
        "failed_attempts": 3,
        "source_ip": "198.51.100.77",
        "target_ip": "10.0.0.5",
        "triggering_event_id": 4,
        "user": "sec_admin"
      },
      "mitigation_hint": "Verify user identity immediately, check for credential compromise, and revoke active sessions if unauthorized."
    }
  ]
}
Error Responses:
400 BAD_REQUEST (INVALID_SCENARIO): Scenario string not in recognized scenario list.
4. Frontend Integration Notes
Case Sensitivity:
Statuses in PATCH /api/alerts/<id> must be uppercase ("INVESTIGATING", "RESOLVED", etc.).
Severities in filters must be uppercase ("CRITICAL", "HIGH", etc.).
CORS & Fetch Credentials:
When calling from Vite (http://localhost:5173), ensure standard fetch/axios requests include headers Content-Type: application/json.
Known Compatibility Issues:
None. All 8 requested endpoints are actively registered and tested. Responses conform strictly to the JSON schemas above with zero undocumented wrappers.
