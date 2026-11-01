import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface AlertItem {
  id: string;
  time: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  source: string;
  destination: string;
  status: string;
}

const demoAlerts: AlertItem[] = [
  { id: '1', time: '10:32:45', title: 'Brute Force Login Attempt',  severity: 'Critical', source: '203.0.113.45',  destination: '192.168.1.100', status: 'New' },
  { id: '2', time: '10:31:12', title: 'Malware Detected',           severity: 'High',     source: '192.168.1.25',  destination: '192.168.1.80',  status: 'New' },
  { id: '3', time: '10:30:05', title: 'Phishing URL Detected',      severity: 'Medium',   source: '203.0.113.78',  destination: '192.168.1.15',  status: 'Investigating' },
  { id: '4', time: '10:29:47', title: 'Unusual Data Transfer',      severity: 'High',     source: '192.168.1.30',  destination: '203.0.113.200', status: 'Investigating' },
  { id: '5', time: '10:28:33', title: 'Exploit Attempt Blocked',    severity: 'Critical', source: '198.51.100.23', destination: '198.51.1.5',    status: 'New' },
];

const sevBadge: Record<string, string> = {
  Critical: 'badge-critical',
  High:     'badge-high',
  Medium:   'badge-medium',
  Low:      'badge-low',
};

const statusBadge: Record<string, string> = {
  New:           'badge-new',
  Investigating: 'badge-investigating',
  Resolved:      'badge-resolved',
};

function RecentAlerts() {
  return (
    <div className="soc-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2544]">
        <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
        <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
          View all alerts <ArrowRight size={12} />
        </button>
      </div>
      <div className="overflow-x-auto">
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
            {demoAlerts.map((a) => (
              <tr key={a.id}>
                <td className="font-mono text-gray-500">{a.time}</td>
                <td className="font-medium text-gray-200">{a.title}</td>
                <td>
                  <span className={sevBadge[a.severity]}>{a.severity}</span>
                </td>
                <td className="font-mono">{a.source}</td>
                <td className="font-mono">{a.destination}</td>
                <td>
                  <span className={statusBadge[a.status] || 'badge'}>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentAlerts;
