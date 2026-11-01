import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import EventChart from '../components/dashboard/EventChart';
import SeverityChart from '../components/dashboard/SeverityChart';
import RecentAlerts from '../components/dashboard/RecentAlerts';
import RecentEvents from '../components/dashboard/RecentEvents';
import AttackTypesChart from '../components/dashboard/AttackTypesChart';
import TopCountries from '../components/dashboard/TopCountries';
import { useStats } from '../hooks/useStats';
import { AlertTriangle, ShieldAlert, Crosshair, Activity, CheckCircle2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

function DashboardPage() {
  const { data: stats, loading, error, refetch } = useStats();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* ── Top Bar with Lab Shortcut ─────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Security Operations Center (SOC) Overview
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Unified real-time threat intelligence and alert telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/threats"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Play size={12} fill="currentColor" />
              <span>Simulate Attack</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center justify-between">
            <span>Failed to load live metrics: {error}</span>
            <button onClick={() => refetch()} className="underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        {/* ── KPI Row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            label="Total Alerts"
            value={loading ? '...' : (stats?.total_alerts ?? 0)}
            change={stats ? `${stats.alerts_last_24h} in 24h` : undefined}
            changeUp={true}
            icon={AlertTriangle}
            accent="cyan"
          />
          <StatCard
            label="Critical Alerts"
            value={loading ? '...' : (stats?.critical_alerts ?? 0)}
            change={stats ? `${stats.high_alerts} high` : undefined}
            changeUp={false}
            icon={ShieldAlert}
            accent="red"
          />
          <StatCard
            label="Open Alerts"
            value={loading ? '...' : (stats?.open_alerts ?? 0)}
            change={stats ? `${stats.investigating_alerts} investigating` : undefined}
            changeUp={true}
            icon={Crosshair}
            accent="orange"
          />
          <StatCard
            label="Total Events"
            value={loading ? '...' : (stats?.total_events?.toLocaleString() ?? 0)}
            change={stats ? `${stats.events_last_24h} in 24h` : undefined}
            changeUp={true}
            icon={Activity}
            accent="green"
          />
          <StatCard
            label="Resolved Alerts"
            value={loading ? '...' : (stats?.resolved_alerts ?? 0)}
            change={stats ? `Active posture` : undefined}
            changeUp={true}
            icon={CheckCircle2}
            accent="purple"
          />
        </div>

        {/* ── Middle Row: Charts & Sidebar Cards ──────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left column: Event chart + sub-cards */}
          <div className="xl:col-span-8 space-y-4">
            <EventChart />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TopCountries />
              <AttackTypesChart />
            </div>
          </div>

          {/* Right column: Severity + System Status / Cases */}
          <div className="xl:col-span-4 space-y-4">
            <SeverityChart alertsDistribution={stats?.severity_distribution?.alerts} />
            <RecentEvents />
          </div>
        </div>

        {/* ── Bottom Row: Recent Alerts Table ─────────── */}
        <RecentAlerts />

        {/* ── Status notice ────────────────────────── */}
        <p className="text-center text-[10px] text-gray-500 pb-2">
          Mini-SIEM Real-Time Telemetry · API: http://127.0.0.1:5000/api
        </p>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;
