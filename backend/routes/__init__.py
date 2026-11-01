from routes.events import events_bp
from routes.alerts import alerts_bp
from routes.stats import stats_bp
from routes.simulation import simulate_bp, simulation_bp

__all__ = ["events_bp", "alerts_bp", "stats_bp", "simulate_bp", "simulation_bp"]
