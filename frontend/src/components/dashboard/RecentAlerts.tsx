import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlerts } from '../../hooks/useAlerts';

const sevBadge: Record<string, string> = {
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

const statusBadge: Record<string, string> = {
  OPEN: 'badge-new',
  INVESTIGATING: 'badge-investigating',
  RESOLVED: 'badge-resolved',
  FALSE_POSITIVE: 'badge-low',
  CLOSED: 'badge-medium',
  New: 'badge-new',
  Investigating: 'badge-investigating',
  Resolved: 'badge-resolved',
};

function RecentAlerts() {
  const { data: alerts = [], loading } = useAlerts({ limit: 5 });

  return (
    <div className="soc-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2544]">
        <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
        <Link
          to="/alerts"
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          View all alerts <ArrowRight size={12} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        {loading && alerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">Loading recent alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-1">
            <ShieldCheck size={24} className="text-emerald-400 mb-1" />
            <span>No security alerts detected. System is secure.</span>
          </div>
        ) : (
          <table className="soc-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Alert Name</th>
                <th>Severity</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-gray-500 text-xs">
                    {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '-'}
                  </td>
                  <td className="font-medium text-gray-200 text-xs">{a.title}</td>
                  <td>
                    <span className={sevBadge[a.severity] || 'badge'}>{a.severity}</span>
                  </td>
                  <td className="font-mono text-cyan-300 text-xs">{a.source_ip || '-'}</td>
                  <td className="font-mono text-gray-400 text-xs">{a.destination_ip || '-'}</td>
                  <td>
                    <span className={statusBadge[a.status] || 'badge'}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default RecentAlerts;
