import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useEvents } from '../hooks/useEvents';
import { Clock, RefreshCw, Search, ShieldAlert } from 'lucide-react';

const severityBadge: Record<string, string> = {
  CRITICAL: 'badge-critical',
  HIGH: 'badge-high',
  MEDIUM: 'badge-medium',
  LOW: 'badge-low',
  INFO: 'badge-new',
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
  Info: 'badge-new',
};

function LogExplorerPage() {
  const { data: events = [], loading, error, refetch } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.sourceIp && e.sourceIp.toLowerCase().includes(term)) ||
      (e.destinationIp && e.destinationIp.toLowerCase().includes(term)) ||
      (e.type && e.type.toLowerCase().includes(term)) ||
      (e.severity && e.severity.toLowerCase().includes(term)) ||
      (e.details && e.details.toLowerCase().includes(term)) ||
      (e.user && e.user.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <ShieldAlert className="text-cyan-400" size={22} />
              Log Explorer
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Real-time normalized security event stream across all monitored assets
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="flex items-center bg-[#0f1629] border border-[#1a2544] rounded-lg px-3 py-1.5 gap-2 w-64">
              <Search size={14} className="text-gray-500" />
              <input
                type="text"
                placeholder="Filter events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-gray-200 outline-none flex-1 placeholder-gray-600"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="p-2 bg-[#0f1629] border border-[#1a2544] hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors flex items-center justify-center"
              title="Refresh events"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-cyan-400' : ''} />
            </button>
          </div>
        </div>

        {/* Content Card */}
        <div className="soc-card overflow-hidden">
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center justify-between">
              <span>Error loading events: {error}</span>
              <button
                onClick={() => refetch()}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {loading && events.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="animate-spin mx-auto mb-2 text-cyan-400" size={24} />
              <p className="text-sm">Ingesting and loading security events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-sm">No security events found matching the criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="soc-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Source IP</th>
                    <th>Dest IP</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-gray-400 whitespace-nowrap text-xs">
                        <Clock size={11} className="inline mr-1 text-gray-600" />
                        {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '-'}
                      </td>
                      <td className="font-mono text-cyan-300 text-xs">{e.sourceIp}</td>
                      <td className="font-mono text-gray-400 text-xs">{e.destinationIp ?? '-'}</td>
                      <td>
                        <span className="font-mono text-xs bg-[#141d35] px-2 py-0.5 rounded text-gray-300">
                          {e.type}
                        </span>
                      </td>
                      <td>
                        <span className={severityBadge[e.severity] || 'badge'}>
                          {e.severity}
                        </span>
                      </td>
                      <td className="text-gray-300 text-xs max-w-md truncate" title={e.details}>
                        {e.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default LogExplorerPage;
