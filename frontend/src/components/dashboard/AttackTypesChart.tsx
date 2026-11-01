import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { fetchTopEventTypes, EventTypeCount } from '../../services/statsService';

const COLOR_PALETTE = ['#e63946', '#f48c06', '#00b4d8', '#7c3aed', '#2a9d8f', '#457b9d', '#e76f51'];

function formatTypeName(raw: string) {
  return raw
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function AttackTypesChart() {
  const [data, setData] = useState<{ name: string; value: number; count: number; color: string }[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = () => {
    fetchTopEventTypes()
      .then((res) => {
        if (res && Array.isArray(res.event_types) && res.event_types.length > 0) {
          const total = res.event_types.reduce((sum, item: EventTypeCount) => sum + item.count, 0);
          setTotalCount(total);
          const slices = res.event_types.slice(0, 5).map((item, idx) => ({
            name: formatTypeName(item.event_type),
            count: item.count,
            value: total > 0 ? Math.round((item.count / total) * 100) : 0,
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
          }));
          setData(slices);
        } else {
          setData([]);
          setTotalCount(0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();

    const handleRefresh = () => {
      loadData();
    };

    window.addEventListener('siem:refresh', handleRefresh);
    return () => {
      window.removeEventListener('siem:refresh', handleRefresh);
    };
  }, []);

  const displayData = data.length > 0
    ? data
    : [{ name: 'No Events', value: 100, count: 0, color: '#1a2544' }];

  return (
    <div className="soc-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Top Event Types</h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="95%"
                dataKey="value"
                strokeWidth={0}
              >
                {displayData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              {totalCount > 0 && (
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="bg-[#141d35] border border-[#1a2544] rounded-lg px-3 py-2 shadow-xl text-xs">
                        <span style={{ color: d.payload.color }}>
                          {d.payload.name}: {d.payload.count} ({d.payload.value}%)
                        </span>
                      </div>
                    );
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-white">{totalCount}</span>
            <span className="text-[9px] text-gray-500">Events</span>
          </div>
        </div>

        <ul className="space-y-2 flex-1">
          {data.length === 0 ? (
            <li className="text-xs text-gray-500">No events logged yet.</li>
          ) : (
            data.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </span>
                <span className="text-white font-medium">{d.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default AttackTypesChart;
