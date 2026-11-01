import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { fetchTimeline, TimelineBucket } from '../../services/statsService';

interface ChartPoint {
  time: string;
  events: number;
  alerts: number;
}

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
  const [data, setData] = useState<ChartPoint[]>([]);

  const loadTimeline = () => {
    fetchTimeline()
      .then((res) => {
        if (res && Array.isArray(res.timeline)) {
          const formatted = res.timeline.map((b: TimelineBucket) => {
            let label = b.hour;
            try {
              const dt = new Date(b.hour);
              label = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } catch {
              label = b.hour.slice(11, 16);
            }
            return {
              time: label,
              events: b.events,
              alerts: b.alerts,
            };
          });
          setData(formatted);
        }
      })
      .catch(() => {
        // Fallback or empty
      });
  };

  useEffect(() => {
    loadTimeline();

    const handleRefresh = () => {
      loadTimeline();
    };

    window.addEventListener('siem:refresh', handleRefresh);
    return () => {
      window.removeEventListener('siem:refresh', handleRefresh);
    };
  }, []);

  return (
    <div className="soc-card p-5 h-80">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Security Event &amp; Alert Telemetry</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Events &amp; alerts over the past 24 hours</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data.length > 0 ? data : [{ time: 'Now', events: 0, alerts: 0 }]}>
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
