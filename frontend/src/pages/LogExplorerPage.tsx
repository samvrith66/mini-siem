import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useEvents } from '../hooks/useEvents';
import { Clock } from 'lucide-react';

function LogExplorerPage() {
  const { data: events = [], loading, error } = useEvents();

  return (
    <DashboardLayout>
      <div className="bg-bg-card rounded-lg p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-white mb-4">Log Explorer</h2>
        {loading && <p className="text-gray-400">Loading events…</p>}
        {error && <p className="text-red-500">{error}</p>}
        <table className="w-full text-sm border-collapse">
          <thead className="border-b border-gray-600">
            <tr className="text-left text-gray-300">
              <th className="p-2">Time</th>
              <th className="p-2">Source IP</th>
              <th className="p-2">Dest IP</th>
              <th className="p-2">Type</th>
              <th className="p-2">Severity</th>
              <th className="p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-gray-700 hover:bg-bg-primary">
                <td className="p-2">
                  <Clock size={12} className="inline mr-1" />
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td className="p-2">{e.sourceIp}</td>
                <td className="p-2">{e.destinationIp ?? '-'}</td>
                <td className="p-2">{e.type}</td>
                <td className="p-2">{e.severity}</td>
                <td className="p-2">{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default LogExplorerPage;

