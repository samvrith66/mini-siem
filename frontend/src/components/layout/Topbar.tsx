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
  X,
} from 'lucide-react';

const topNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/threats', label: 'Incidents', icon: Crosshair },
  { to: '#', label: 'Threat Intel', icon: Shield },
  { to: '#', label: 'Reports', icon: FileText },
  { to: '#', label: 'Playbooks', icon: BookOpen },
];

interface TopbarProps {
  onToggleSidebar?: () => void;
}

function Topbar({ onToggleSidebar }: TopbarProps) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

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

      {/* Search */}
      <div className="hidden sm:flex items-center bg-[#0f1629] border border-[#1a2544] rounded-lg px-3 py-1.5 gap-2 w-56">
        <Search size={14} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search events..."
          className="bg-transparent text-xs text-gray-300 outline-none flex-1 placeholder-gray-600"
        />
        <kbd className="text-[10px] text-gray-600 border border-[#1a2544] rounded px-1">/</kbd>
      </div>

      {/* Notifications */}
      <button className="relative text-gray-400 hover:text-white transition-colors">
        <Bell size={18} />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
          12
        </span>
      </button>

      {/* Settings */}
      <Link to="/" className="text-gray-400 hover:text-white transition-colors">
        <Settings size={18} />
      </Link>

      {/* User avatar */}
      <div className="flex items-center gap-2 pl-3 border-l border-[#1a2544]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
        <div className="hidden md:block leading-tight">
          <p className="text-xs font-medium text-white">Analyst</p>
          <p className="text-[10px] text-gray-500">Tier 1 Analyst</p>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
