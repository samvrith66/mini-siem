import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface SystemItem {
  name: string;
  status: 'Operational' | 'Degraded' | 'Down';
}

interface CaseItem {
  id: string;
  title: string;
  caseNo: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  age: string;
}

const systemStatus: SystemItem[] = [
  { name: 'SIEM', status: 'Operational' },
  { name: 'EDR', status: 'Operational' },
  { name: 'Network Sensors', status: 'Operational' },
  { name: 'Threat Intel Feeds', status: 'Operational' },
  { name: 'SOAR', status: 'Operational' },
];

const recentCases: CaseItem[] = [
  { id: '1', title: 'Suspicious PowerShell Activity', caseNo: '#CASE-1024', severity: 'High', age: '2h ago' },
  { id: '2', title: 'Multiple Failed Logins', caseNo: '#CASE-1023', severity: 'Medium', age: '4h ago' },
  { id: '3', title: 'Malware Detected on Host', caseNo: '#CASE-1022', severity: 'High', age: '6h ago' },
];

const sevColor: Record<string, string> = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

function RecentEvents() {
  return (
    <div className="space-y-4">
      {/* System Status */}
      <div className="soc-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">System Status</h3>
        <div className="space-y-3">
          {systemStatus.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{s.name}</span>
              <span className="badge-operational flex items-center gap-1">
                <CheckCircle size={10} />
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Cases */}
      <div className="soc-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Cases</h3>
          <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-3">
          {recentCases.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0a0f24] border border-[#111b33] hover:border-[#1a2544] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-200 truncate">{c.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{c.caseNo}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className={sevColor[c.severity]}>{c.severity}</span>
                <span className="text-[10px] text-gray-600">{c.age}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecentEvents;
