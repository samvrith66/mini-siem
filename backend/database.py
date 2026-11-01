import sqlite3
from contextlib import contextmanager
from pathlib import Path
from flask import g, has_app_context

# Store the SQLite database file inside the backend directory
BACKEND_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BACKEND_DIR / "mini_siem.db"


def connect_db() -> sqlite3.Connection:
    """Create a new SQLite connection with WAL mode and foreign key constraints enabled."""
    conn = sqlite3.connect(
        str(DATABASE_PATH),
        detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        check_same_thread=False
    )
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for concurrency and foreign keys for relational integrity
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def get_db() -> sqlite3.Connection:
    """Retrieve or create a thread-local SQLite connection for the current Flask request context."""
    if has_app_context():
        if "_database" not in g:
            g._database = connect_db()
        return g._database
    return connect_db()


def close_db(e=None):
    """Close the active database connection if one was opened during this request."""
    if has_app_context():
        db = g.pop("_database", None)
        if db is not None:
            db.close()


@contextmanager
def db_transaction():
    """Context manager for standalone operations guaranteeing atomic transaction commit or rollback."""
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def query_db(query: str, args=(), one: bool = False):
    """Execute a parameterized read query and return row(s) safely."""
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


def execute_db(query: str, args=()):
    """Execute a parameterized write query with automatic commit or rollback on failure."""
    db = get_db()
    try:
        cur = db.execute(query, args)
        db.commit()
        last_id = cur.lastrowid
        rowcount = cur.rowcount
        cur.close()
        return last_id, rowcount
    except Exception:
        db.rollback()
        raise


def init_db():
    """Initialize database tables, indices, and schema constraints if not present."""
    schema_sql = """
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        destination_ip TEXT,
        source_port INTEGER,
        destination_port INTEGER,
        protocol TEXT NOT NULL DEFAULT 'TCP',
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'INFO',
        user TEXT,
        message TEXT,
        raw_data TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN',
        source_ip TEXT,
        destination_ip TEXT,
        event_count INTEGER NOT NULL DEFAULT 1,
        details TEXT,
        mitigation_hint TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_source_ip ON events(source_ip);
    CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);

    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_source_ip ON alerts(source_ip);
    """
    db = get_db()
    try:
        db.executescript(schema_sql)
        db.commit()
    except Exception:
        db.rollback()
        raise
