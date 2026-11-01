import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAlerts } from '../hooks/useAlerts';
import { CheckCircle, AlertTriangle } from 'lucide-react';

function AlertsPage() {
  const { data: alerts = [], loading, error, patchStatus } = useAlerts();

  const statusColors: Record<string, string> = {
    New: 'text-blue-400',
    Investigating: 'text-yellow-400',
    Resolved: 'text-green-400',
    'False Positive': 'text-gray-400',
  };

  const handleStatusChange = (id: string, current: string) => {
    const next = current === 'New' ? 'Investigating' : 'Resolved';
    patchStatus(id, next);
  };

  return (
    <DashboardLayout>
      <div className="bg-bg-card rounded-lg p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Security Alerts</h2>
        {loading && <p className="text-gray-400">Loading alerts…</p>}
        {error && <p className="text-red-500">{error}</p>}
        <table className="w-full text-sm border-collapse">
          <thead className="border-b border-gray-600">
            <tr className="text-left text-gray-300">
              <th className="p-2">Title</th>
              <th className="p-2">Severity</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-b border-gray-700 hover:bg-bg-primary">
                <td className="p-2 flex items-center space-x-2">
                  <AlertTriangle className="text-red-500" size={14} />
                  <span>{a.title}</span>
                </td>
                <td className="p-2">{a.severity}</td>
                <td className={`p-2 ${statusColors[a.status] || ''}`}>{a.status}</td>
                <td className="p-2">
                  <button
                    className="bg-accent hover:bg-accent/90 text-white px-3 py-1 rounded"
                    onClick={() => handleStatusChange(a.id, a.status)}
                  >
                    {a.status === 'New' ? 'Start Investigation' : 'Mark Resolved'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default AlertsPage;

