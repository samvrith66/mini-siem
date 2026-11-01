import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useStats } from '../../hooks/useStats';

const SEVERITY_CONFIG = [
  { key: 'CRITICAL', name: 'Critical', color: '#e63946' },
  { key: 'HIGH', name: 'High', color: '#f48c06' },
  { key: 'MEDIUM', name: 'Medium', color: '#457b9d' },
  { key: 'LOW', name: 'Low', color: '#2a9d8f' },
];

interface SeverityChartProps {
  alertsDistribution?: {
    CRITICAL?: number;
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
    [key: string]: number | undefined;
  };
}

const CustomTooltip = ({ active, payload, total }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
  return (
    <div className="bg-[#141d35] border border-[#1a2544] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold" style={{ color: d.payload.color }}>
        {d.name}: {d.value} ({pct}%)
      </p>
    </div>
  );
};

function SeverityChart({ alertsDistribution }: SeverityChartProps) {
  const { data: stats } = useStats();

  const dist = alertsDistribution || stats?.severity_distribution?.alerts || {};

  const severityData = SEVERITY_CONFIG.map((cfg) => ({
    name: cfg.name,
    value: dist[cfg.key] || 0,
    color: cfg.color,
  }));

  const total = severityData.reduce((s, d) => s + d.value, 0);

  // If no alerts yet, provide a baseline slice for rendering without breaking Recharts
  const displayData = total === 0
    ? [{ name: 'No Alerts', value: 1, color: '#1a2544' }]
    : severityData;

  return (
    <div className="soc-card p-5 h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Alert Distribution</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">By severity level · Real-time telemetry</p>
        </div>
      </div>
      <div className="flex items-center h-[calc(100%-3rem)]">
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                dataKey="value"
                strokeWidth={0}
              >
                {displayData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              {total > 0 && <Tooltip content={(props) => <CustomTooltip {...props} total={total} />} />}
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[10px] text-gray-500">Alerts</span>
          </div>
        </div>
        <div className="w-1/2 pl-4">
          <ul className="space-y-2 text-xs">
            {severityData.map((entry, i) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <li key={i} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                    <span className="text-gray-400">{entry.name}</span>
                  </span>
                  <span className="text-white font-medium">
                    {entry.value} ({pct}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SeverityChart;
