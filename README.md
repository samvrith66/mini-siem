# Mini-SIEM: Security Log Monitoring & Threat Detection Platform

A lightweight Security Information and Event Management (SIEM) platform that collects security events, detects suspicious activity using rule-based detection, and generates security alerts through an interactive dashboard.

## Overview

Mini-SIEM demonstrates the core workflow of a Security Operations Centre (SOC). It centralizes security logs, analyzes event patterns, identifies potentially malicious activity, and helps analysts investigate generated alerts.

The project is designed as an educational cybersecurity prototype to demonstrate fundamental SIEM concepts, log analysis, threat detection, and incident management.

## Features

- **Security Log Collection:** Ingest security events through REST APIs and simulated attack scenarios.
- **Log Normalization:** Convert incoming events into a standardized format.
- **Rule-Based Threat Detection:** Identify suspicious behavior using predefined detection rules.
- **Alert Generation:** Generate alerts with severity classifications.
- **Alert Management:** Track alerts through New, Investigating, Resolved, and False Positive states.
- **SOC Dashboard:** View security statistics, recent events, alerts, and threat distributions.
- **Attack Simulation:** Generate controlled events to test detection capabilities.

## Detection Rules

| Detection | Trigger condition | Severity |
|---|---|---|
| SSH Brute-Force | 5 or more failed login attempts from one IP within 60 seconds | High |
| Port Scanning | 10 or more distinct destination ports targeted by one IP within 60 seconds | Medium |
| Suspicious Login | Successful login following multiple failed attempts from the same IP and username | Critical |

*These are configurable prototype detection thresholds, not universal indicators of malicious activity.*

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Python, Flask |
| Database | SQLite |
| API Communication | REST, JSON |
| Charts | Recharts |
| Version Control | Git, GitHub |

## Architecture

```text
       SECURITY EVENT SOURCES
      (Sample Logs / Simulations)
                 |
                 v
          LOG INGESTION API
                 |
                 v
          LOG NORMALIZATION
                 |
                 v
        THREAT DETECTION ENGINE
                 |
                 v
           ALERT GENERATION
                 |
                 v
            SQLITE DATABASE
                 |
                 v
              REST API
                 |
                 v
          REACT SOC DASHBOARD
```

## Project Structure

```text
mini-siem/
│
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── models.py
│   ├── routes/
│   ├── detection/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── API_CONTRACT.md
│   └── DATABASE_SCHEMA.md
│
├── README.md
└── .gitignore
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Python 3.10 or later
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd mini-siem
```

### 2. Start the Backend

```bash
cd backend

python -m venv venv
```

Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask server:

```bash
python app.py
```

The backend should run at:

`http://localhost:5000`

### 3. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend should be available at:

`http://localhost:5173`

### 4. Open the Dashboard

Visit `http://localhost:5173` in your browser.

Make sure the backend is running before using dashboard features.

## API Endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check backend status |
| POST | `/events` | Submit a security event |
| GET | `/events` | Retrieve security events |
| GET | `/alerts` | Retrieve generated alerts |
| GET | `/stats` | Retrieve dashboard statistics |
| PATCH | `/alerts/{id}` | Update alert status |
| POST | `/simulate/{scenario}` | Simulate a security scenario |

## Attack Simulation

The platform supports controlled security event simulations:

- **Brute Force:** Generates repeated failed login attempts.
- **Port Scan:** Generates connection attempts targeting multiple ports.
- **Suspicious Login:** Generates failed login attempts followed by a successful login.

These simulations allow users to verify that the detection engine identifies suspicious patterns and generates the expected alerts.

## Testing the Project

A basic demonstration workflow:

1. Start the backend and frontend.
2. Open the Mini-SIEM dashboard.
3. Trigger the brute-force simulation.
4. Verify that failed login events appear in the event logs.
5. Check that a high-severity brute-force alert is generated.
6. Change the alert status to Investigating.
7. Refresh the dashboard and verify that the updated status persists.

## Screenshots

Add screenshots of your actual application here after implementation.

```md
![Mini-SIEM Dashboard](docs/screenshots/dashboard.png)

![Security Alerts](docs/screenshots/alerts.png)

![Security Events](docs/screenshots/events.png)
```

## Project Scope and Limitations

Mini-SIEM is an educational prototype intended to demonstrate fundamental SIEM functionality.

- Uses simulated and controlled security events.
- Uses predefined rule-based detection rather than machine learning.
- Uses SQLite for lightweight local storage.
- Does not provide enterprise-scale log ingestion or production-grade monitoring.
- Does not replace commercial SIEM platforms.

## Future Improvements

- Real-time log streaming using WebSockets or Server-Sent Events.
- Integration with Linux authentication logs.
- Additional detection rules mapped to MITRE ATT&CK.
- IP reputation and threat intelligence integration.
- Role-based authentication and access control.
- Advanced incident investigation and reporting.

## Team

Developed collaboratively by a two-person team as a cybersecurity project focused on SIEM concepts, security event monitoring, threat detection, and incident management.

## Disclaimer

This project is intended for educational and authorized testing purposes only. Attack simulations generate controlled sample events and should only be used in environments where you have permission to conduct testing.
