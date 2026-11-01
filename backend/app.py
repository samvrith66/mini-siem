import sys
from pathlib import Path

# Ensure backend directory is in sys.path for direct script execution
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from database import close_db, get_db, init_db
from models import error_response, get_utc_now_iso
from routes import alerts_bp, events_bp, simulate_bp, simulation_bp, stats_bp


def create_app() -> Flask:
    """Factory creating and configuring the Mini-SIEM Flask application."""
    app = Flask(__name__)

    # Configure CORS for local Vite frontend at http://localhost:5173
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ]
            }
        },
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    # Automatically close per-request database connections
    app.teardown_appcontext(close_db)

    # Register blueprints for events, alerts, statistics, and simulations
    app.register_blueprint(events_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(simulate_bp)
    app.register_blueprint(simulation_bp)

    # GET /api/health
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """Health check endpoint indicating backend operational status."""
        try:
            db = get_db()
            db.execute("SELECT 1").fetchone()
            db_status = "operational"
        except Exception as e:
            db_status = f"error: {str(e)}"

        is_operational = db_status == "operational"
        return jsonify({
            "status": "operational" if is_operational else "degraded",
            "service": "Mini-SIEM Backend",
            "database": db_status,
            "timestamp": get_utc_now_iso(),
            "blueprints": [
                "events (/api/events)",
                "alerts (/api/alerts)",
                "stats (/api/stats)",
                "simulate (/api/simulate/<scenario>)",
                "simulation (/api/simulation/run)"
            ]
        }), 200 if is_operational else 503

    # Error Handlers with consistent JSON structure
    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        return error_response(
            message=e.description or "HTTP error occurred",
            status_code=e.code or 500
        )

    @app.errorhandler(Exception)
    def handle_unexpected_exception(e: Exception):
        return error_response(
            message="An unexpected internal error occurred",
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR"
        )

    # Initialize SQLite database automatically when the application starts
    with app.app_context():
        init_db()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
