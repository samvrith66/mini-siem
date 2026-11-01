import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const attackData = [
  { name: 'Brute Force', value: 35, color: '#e63946' },
  { name: 'Malware',     value: 26, color: '#f48c06' },
  { name: 'Phishing',    value: 20, color: '#00b4d8' },
  { name: 'Exploitation',value: 12, color: '#7c3aed' },
  { name: 'Other',       value: 9,  color: '#2a9d8f' },
];

const total = attackData.reduce((s, d) => s + d.value, 0);

function AttackTypesChart() {
  return (
    <div className="soc-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Attack Types</h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={attackData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="95%"
                dataKey="value"
                strokeWidth={0}
              >
                {attackData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div className="bg-[#141d35] border border-[#1a2544] rounded-lg px-3 py-2 shadow-xl text-xs">
                      <span style={{ color: d.payload.color }}>{d.name}: {d.value}%</span>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-white">{total * 6 + 2}</span>
            <span className="text-[9px] text-gray-500">Total</span>
          </div>
        </div>
        <ul className="space-y-2 flex-1">
          {attackData.map((d) => (
            <li key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-gray-400">{d.name}</span>
              </span>
              <span className="text-white font-medium">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AttackTypesChart;

