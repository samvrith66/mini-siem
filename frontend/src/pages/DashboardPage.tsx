import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import EventChart from '../components/dashboard/EventChart';
import SeverityChart from '../components/dashboard/SeverityChart';
import RecentAlerts from '../components/dashboard/RecentAlerts';
import RecentEvents from '../components/dashboard/RecentEvents';
import AttackTypesChart from '../components/dashboard/AttackTypesChart';
import TopCountries from '../components/dashboard/TopCountries';
import { AlertTriangle, ShieldAlert, Crosshair, Monitor, ShieldOff } from 'lucide-react';

function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* ── KPI Row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            label="Total Alerts"
            value={128}
            change="↑ 23%"
            changeUp={true}
            icon={AlertTriangle}
            accent="cyan"
          />
          <StatCard
            label="Critical Alerts"
            value={18}
            change="↑ 12%"
            changeUp={false}
            icon={ShieldAlert}
            accent="red"
          />
          <StatCard
            label="Open Incidents"
            value={7}
            change="↓ 13%"
            changeUp={true}
            icon={Crosshair}
            accent="orange"
          />
          <StatCard
            label="Assets Monitored"
            value="1,248"
            change="↑ 6%"
            changeUp={true}
            icon={Monitor}
            accent="green"
          />
          <StatCard
            label="Threats Blocked"
            value={342}
            change="↑ 31%"
            changeUp={true}
            icon={ShieldOff}
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
            <SeverityChart />
            <RecentEvents />
          </div>
        </div>

        {/* ── Bottom Row: Recent Alerts Table ─────────── */}
        <RecentAlerts />

        {/* ── Demo data notice ────────────────────────── */}
        <p className="text-center text-[10px] text-gray-600 pb-2">
          Dashboard data is simulated for demonstration purposes
        </p>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;
