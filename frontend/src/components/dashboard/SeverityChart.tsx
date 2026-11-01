import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const severityData = [
  { name: 'Critical', value: 18, color: '#e63946' },
  { name: 'High',     value: 32, color: '#f48c06' },
  { name: 'Medium',   value: 45, color: '#457b9d' },
  { name: 'Low',      value: 25, color: '#2a9d8f' },
];

const total = severityData.reduce((s, d) => s + d.value, 0);

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#141d35] border border-[#1a2544] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold" style={{ color: d.payload.color }}>
        {d.name}: {d.value} ({Math.round((d.value / total) * 100)}%)
      </p>
    </div>
  );
};

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="space-y-2 text-xs">
      {payload.map((entry: any, i: number) => (
        <li key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-gray-400">{entry.value}</span>
          </span>
          <span className="text-white font-medium">
            {severityData[i].value} ({Math.round((severityData[i].value / total) * 100)}%)
          </span>
        </li>
      ))}
    </ul>
  );
};

function SeverityChart() {
  return (
    <div className="soc-card p-5 h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Alert Distribution</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">By severity · Demo data</p>
        </div>
        <select className="bg-[#141d35] border border-[#1a2544] text-xs text-gray-400 rounded-md px-2 py-1 outline-none">
          <option>Last 24 Hours</option>
          <option>Last 7 Days</option>
        </select>
      </div>
      <div className="flex items-center h-[calc(100%-3rem)]">
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                dataKey="value"
                strokeWidth={0}
              >
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[10px] text-gray-500">Total</span>
          </div>
        </div>
        <div className="w-1/2 pl-4">
          {renderLegend({ payload: severityData.map((d) => ({ value: d.name, color: d.color })) })}
        </div>
      </div>
    </div>
  );
}

export default SeverityChart;
