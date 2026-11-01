import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;          // e.g. "↑ 23%"
  changeUp?: boolean;       // true = positive (cyan), false = negative (red)
  icon?: LucideIcon;
  accent?: 'cyan' | 'red' | 'orange' | 'green' | 'purple';
}

const accentClass: Record<string, string> = {
  cyan:   'kpi-cyan',
  red:    'kpi-red',
  orange: 'kpi-orange',
  green:  'kpi-green',
  purple: 'kpi-purple',
};

function StatCard({
  label,
  value,
  change,
  changeUp = true,
  icon: Icon,
  accent = 'cyan',
}: StatCardProps) {
  return (
    <div className={`kpi-card ${accentClass[accent]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-white/5">
            <Icon size={20} className="text-gray-500" />
          </div>
        )}
      </div>
      {change && (
        <p className={`mt-3 text-xs font-medium flex items-center gap-1 ${
          changeUp ? 'text-cyan-400' : 'text-red-400'
        }`}>
          {changeUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
          <span className="text-gray-600 ml-1">vs last 24h</span>
        </p>
      )}
    </div>
  );
}

export default StatCard;
