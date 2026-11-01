import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const demoData = [
  { time: '00:00', events: 45, alerts: 8 },
  { time: '02:00', events: 52, alerts: 12 },
  { time: '04:00', events: 38, alerts: 6 },
  { time: '06:00', events: 65, alerts: 14 },
  { time: '08:00', events: 85, alerts: 22 },
  { time: '10:00', events: 72, alerts: 18 },
  { time: '12:00', events: 110, alerts: 28 },
  { time: '14:00', events: 95, alerts: 24 },
  { time: '16:00', events: 130, alerts: 35 },
  { time: '18:00', events: 105, alerts: 20 },
  { time: '20:00', events: 78, alerts: 15 },
  { time: '22:00', events: 60, alerts: 10 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141d35] border border-[#1a2544] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function EventChart() {
  return (
    <div className="soc-card p-5 h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Real-time Attack Map</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Events &amp; alerts over 24 hours · Demo data</p>
        </div>
        <select className="bg-[#141d35] border border-[#1a2544] text-xs text-gray-400 rounded-md px-2 py-1 outline-none">
          <option>Last 24 Hours</option>
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={demoData}>
          <defs>
            <linearGradient id="gradEvents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b4d8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00b4d8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAlerts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e63946" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#e63946" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2544" />
          <XAxis
            dataKey="time"
            stroke="#2a3b5c"
            tick={{ fill: '#4b5e7e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#2a3b5c"
            tick={{ fill: '#4b5e7e', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="events"
            name="Events"
            stroke="#00b4d8"
            strokeWidth={2}
            fill="url(#gradEvents)"
          />
          <Area
            type="monotone"
            dataKey="alerts"
            name="Alerts"
            stroke="#e63946"
            strokeWidth={2}
            fill="url(#gradAlerts)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EventChart;
