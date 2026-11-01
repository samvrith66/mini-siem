import React, { useEffect, useState } from 'react';
import { Network } from 'lucide-react';
import { fetchTopIps, TopIpItem } from '../../services/statsService';

function TopCountries() {
  const [sources, setSources] = useState<TopIpItem[]>([]);

  const loadTopIps = () => {
    fetchTopIps()
      .then((res) => {
        if (res && Array.isArray(res.top_source_ips) && res.top_source_ips.length > 0) {
          setSources(res.top_source_ips);
        } else {
          setSources([]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadTopIps();

    const handleRefresh = () => {
      loadTopIps();
    };

    window.addEventListener('siem:refresh', handleRefresh);
    return () => {
      window.removeEventListener('siem:refresh', handleRefresh);
    };
  }, []);

  const maxCount = sources.length > 0 ? Math.max(...sources.map((c) => c.count)) : 1;

  return (
    <div className="soc-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Top Source IPs</h3>
      <div className="space-y-3">
        {sources.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">No source telemetry recorded yet.</p>
        ) : (
          sources.map((c) => (
            <div key={c.ip} className="flex items-center gap-3">
              <span className="p-1 rounded bg-[#141d35] text-cyan-400">
                <Network size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-300 truncate">{c.ip}</span>
                  <span className="text-xs font-semibold text-white">{c.count}</span>
                </div>
                <div className="h-1.5 bg-[#1a2544] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TopCountries;
