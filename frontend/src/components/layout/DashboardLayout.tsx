import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Shield, AlertTriangle } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/* Threat-intelligence ticker items (demo) */
const tickerItems = [
  'New IOC: Malicious IP 185.220.101.45 observed in attacks',
  'Malware Campaign: "Luminous Manticore" targeting financial sector',
  'Critical Vulnerability CVE-2024-3094 detected in your network',
];

function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-primary text-gray-200 overflow-hidden">
      {/* Sidebar – always visible on lg+, slide-over on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-bg-primary">
          {children}
        </main>

        {/* ── Threat Intelligence Ticker ────────────── */}
        <footer className="h-8 bg-[#0a0f24] border-t border-[#1a2544] flex items-center px-4 gap-3 overflow-hidden shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Shield size={12} className="text-cyan-400" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Threat Intel Feed
            </span>
            <span className="ml-1 flex items-center justify-center w-4 h-4 rounded bg-red-500/20 text-[9px] font-bold text-red-400">
              3
            </span>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-ticker whitespace-nowrap flex gap-16">
              {tickerItems.map((item, i) => (
                <span key={i} className="text-[11px] text-gray-500 inline-flex items-center gap-2">
                  <AlertTriangle size={10} className="text-yellow-500/60 shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <button className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors shrink-0">
            View all →
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
