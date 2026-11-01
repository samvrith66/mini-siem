import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchHealth, HealthResponse } from '../../services/statsService';
import { useEvents } from '../../hooks/useEvents';

const sevColor: Record<string, string> = {
  CRITICAL: 'badge-critical',
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
  INFO: 'badge-new',
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

function RecentEvents() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const { data: events = [] } = useEvents({ limit: 4 });

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => {
        setHealth({
          status: 'degraded',
          service: 'Mini-SIEM',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
          blueprints: [],
        });
      });
  }, []);

  const isOperational = health?.status === 'operational' && health?.database === 'operational';

  const systemStatus = [
    { name: 'Flask SIEM Core', status: isOperational ? 'Operational' : 'Degraded' },
    { name: 'SQLite DB Engine', status: health?.database === 'operational' ? 'Operational' : 'Offline' },
    { name: 'Detection Engine', status: isOperational ? 'Operational' : 'Degraded' },
    { name: 'Simulation Lab', status: 'Operational' },
  ];

  return (
    <div className="space-y-4">
      {/* System Status */}
      <div className="soc-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Backend Status</h3>
        <div className="space-y-3">
          {systemStatus.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{s.name}</span>
              <span
                className={
                  s.status === 'Operational'
                    ? 'badge-operational flex items-center gap-1'
                    : 'badge-critical flex items-center gap-1'
                }
              >
                {s.status === 'Operational' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events / Log Stream */}
      <div className="soc-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Live Ingested Events</h3>
          <Link
            to="/logs"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="space-y-2.5">
          {events.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">No recent security events.</p>
          ) : (
            events.slice(0, 3).map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#0a0f24] border border-[#111b33] hover:border-[#1a2544] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-200 truncate">{e.type}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {e.sourceIp} → {e.destinationIp || 'internal'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={sevColor[e.severity] || 'badge'}>{e.severity}</span>
                  <span className="text-[10px] text-gray-600 font-mono">
                    {e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentEvents;
