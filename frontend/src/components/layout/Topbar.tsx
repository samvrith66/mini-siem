import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Settings,
  User,
  Search,
  LayoutDashboard,
  AlertTriangle,
  Crosshair,
  Shield,
  FileText,
  BookOpen,
  Menu,
} from 'lucide-react';
import { useStats } from '../../hooks/useStats';

const topNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/threats', label: 'Threat Lab', icon: Crosshair },
  { to: '#', label: 'Threat Intel', icon: Shield },
  { to: '#', label: 'Reports', icon: FileText },
  { to: '#', label: 'Playbooks', icon: BookOpen },
];

interface TopbarProps {
  onToggleSidebar?: () => void;
}

function Topbar({ onToggleSidebar }: TopbarProps) {
  const location = useLocation();
  const { data: stats } = useStats();
  const openAlerts = stats?.open_alerts ?? 0;

  return (
    <header className="flex items-center h-14 bg-[#0a0f24] border-b border-[#1a2544] px-4 gap-4 shrink-0">
      {/* Hamburger for mobile */}
      <button
        className="lg:hidden text-gray-400 hover:text-white"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Top nav links */}
      <nav className="hidden md:flex items-center gap-1">
        {topNavItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${active
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#141d35]'
                }`}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <Link
        to="/alerts"
        className="relative text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#141d35]"
        title="Active Alerts"
      >
        <Bell size={18} />
        {openAlerts > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {openAlerts}
          </span>
        )}
      </Link>

      {/* Settings */}
      <Link to="/" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#141d35]">
        <Settings size={18} />
      </Link>

      {/* User avatar */}
      <div className="flex items-center gap-2 pl-3 border-l border-[#1a2544]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
        <div className="hidden md:block leading-tight">
          <p className="text-xs font-medium text-white">Analyst</p>
          <p className="text-[10px] text-gray-500">Tier 1 SOC</p>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
