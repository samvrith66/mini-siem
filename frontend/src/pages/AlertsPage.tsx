import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAlerts, VALID_ALERT_STATUSES } from '../hooks/useAlerts';
import { AlertTriangle, Clock, RefreshCw, ShieldAlert, CheckCircle, Search } from 'lucide-react';

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
};

function AlertsPage() {
  const { data: alerts = [], loading, error, patchStatus, refetch } = useAlerts();
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleStatusChange = async (id: string | number, newStatus: string) => {
    try {
      setUpdatingId(id);
      setActionError(null);
      await patchStatus(id, newStatus);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update alert');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesStatus =
      statusFilter === 'ALL' || a.status.toUpperCase() === statusFilter.toUpperCase();
    if (!matchesStatus) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(term)) ||
      (a.description && a.description.toLowerCase().includes(term)) ||
      (a.source_ip && a.source_ip.toLowerCase().includes(term)) ||
      (a.severity && a.severity.toLowerCase().includes(term)) ||
      (a.rule_id && a.rule_id.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={22} />
              Security Alerts
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Correlated detections, incident triage, and automated rule alerts
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0f1629] border border-[#1a2544] text-xs text-gray-300 rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="ALL">All Statuses</option>
              {VALID_ALERT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Search Box */}
            <div className="flex items-center bg-[#0f1629] border border-[#1a2544] rounded-lg px-3 py-1.5 gap-2 w-56">
              <Search size={14} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search alerts..."
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
              title="Refresh alerts"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-cyan-400' : ''} />
            </button>
          </div>
        </div>

        {/* Global Errors */}
        {actionError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Alerts Table Card */}
        <div className="soc-card overflow-hidden">
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center justify-between">
              <span>Error loading alerts: {error}</span>
              <button
                onClick={() => refetch()}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {loading && alerts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="animate-spin mx-auto mb-2 text-cyan-400" size={24} />
              <p className="text-sm">Loading security alerts from SIEM engine...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <ShieldAlert className="mx-auto mb-2 text-gray-600" size={32} />
              <p className="text-sm">No security alerts found matching the current criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="soc-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Alert Title</th>
                    <th>Severity</th>
                    <th>Source IP</th>
                    <th>Count</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((a) => {
                    const isUpdating = updatingId === a.id;
                    const normalizedStatus = a.status.toUpperCase();
                    return (
                      <tr key={a.id}>
                        <td className="font-mono text-gray-400 whitespace-nowrap text-xs">
                          <Clock size={11} className="inline mr-1 text-gray-600" />
                          {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '-'}
                        </td>
                        <td className="font-medium text-gray-200">
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              className={
                                normalizedStatus === 'RESOLVED' || normalizedStatus === 'CLOSED'
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }
                              size={14}
                            />
                            <div>
                              <span className="block text-xs font-semibold">{a.title}</span>
                              <span className="block text-[11px] text-gray-500 max-w-xs truncate" title={a.description}>
                                {a.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={severityBadge[a.severity] || 'badge'}>{a.severity}</span>
                        </td>
                        <td className="font-mono text-xs text-cyan-300">
                          {a.source_ip || '-'}
                        </td>
                        <td className="font-mono text-xs text-gray-400">
                          {a.event_count || 1}
                        </td>
                        <td>
                          <span className={statusBadge[normalizedStatus] || 'badge'}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {/* Primary workflow button */}
                            {normalizedStatus === 'OPEN' ? (
                              <button
                                disabled={isUpdating}
                                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                                onClick={() => handleStatusChange(a.id, 'INVESTIGATING')}
                              >
                                {isUpdating ? '...' : 'Investigate'}
                              </button>
                            ) : normalizedStatus === 'INVESTIGATING' ? (
                              <button
                                disabled={isUpdating}
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                                onClick={() => handleStatusChange(a.id, 'RESOLVED')}
                              >
                                <CheckCircle size={12} />
                                {isUpdating ? '...' : 'Resolve'}
                              </button>
                            ) : (
                              <button
                                disabled={isUpdating}
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                                onClick={() => handleStatusChange(a.id, 'OPEN')}
                              >
                                {isUpdating ? '...' : 'Reopen'}
                              </button>
                            )}

                            {/* Dropdown for explicit status control */}
                            <select
                              disabled={isUpdating}
                              value={normalizedStatus}
                              onChange={(e) => handleStatusChange(a.id, e.target.value)}
                              className="bg-[#141d35] border border-[#1a2544] text-[11px] text-gray-300 rounded px-1.5 py-1 outline-none disabled:opacity-50"
                              title="Set status explicitly"
                            >
                              {VALID_ALERT_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AlertsPage;
