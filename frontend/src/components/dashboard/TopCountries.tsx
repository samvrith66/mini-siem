import React from 'react';

interface CountryData {
  country: string;
  count: number;
  flag: string;
}

const countries: CountryData[] = [
  { country: 'United States', count: 256, flag: '🇺🇸' },
  { country: 'Russia',        count: 142, flag: '🇷🇺' },
  { country: 'China',         count: 98,  flag: '🇨🇳' },
  { country: 'Netherlands',   count: 64,  flag: '🇳🇱' },
  { country: 'Germany',       count: 42,  flag: '🇩🇪' },
];

const maxCount = Math.max(...countries.map((c) => c.count));

function TopCountries() {
  return (
    <div className="soc-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Top Attacking Countries</h3>
      <div className="space-y-3">
        {countries.map((c) => (
          <div key={c.country} className="flex items-center gap-3">
            <span className="text-lg shrink-0">{c.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300 truncate">{c.country}</span>
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
        ))}
      </div>
    </div>
  );
}

export default TopCountries;

