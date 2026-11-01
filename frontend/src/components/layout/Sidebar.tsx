import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Search,
  AlertTriangle,
  Crosshair,
  Globe,
  ShieldAlert,
  FileText,
  BookOpen,
  Settings,
  Shield,
} from 'lucide-react';
import { useStats } from '../../hooks/useStats';

/* Data-source indicators shown at the bottom */
const dataSources = [
  { name: 'Windows Logs', connected: true },
  { name: 'Firewall', connected: true },
  { name: 'DNS Logs', connected: true },
  { name: 'EDR', connected: true },
  { name: 'CloudTrail', connected: true },
];

interface SidebarProps {
  collapsed?: boolean;
}

function Sidebar({ collapsed = false }: SidebarProps) {
  const { data: stats } = useStats();

  const openCount = stats?.open_alerts ?? 0;

  const navSections = [
    {
      items: [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/logs', label: 'Log Explorer', icon: Monitor },
        { to: '/alerts', label: 'SIEM Search', icon: Search },
      ],
    },
    {
      items: [
        {
          to: '/alerts',
          label: 'Alerts',
          icon: AlertTriangle,
          badge: openCount > 0 ? openCount : undefined,
        },
        { to: '/threats', label: 'Threat Lab', icon: Crosshair },
        { to: '/analytics', label: 'Endpoint Security', icon: ShieldAlert },
      ],
    },
    {
      items: [
        { to: '#', label: 'Network Watch', icon: Globe },
        { to: '#', label: 'Threat Intelligence', icon: Shield },
        { to: '#', label: 'Vulnerability Mgmt', icon: ShieldAlert },
        { to: '#', label: 'Case Management', icon: FileText },
        { to: '#', label: 'Reports', icon: FileText },
        { to: '#', label: 'Playbooks', icon: BookOpen },
        { to: '#', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <nav
      className={`flex flex-col h-full bg-[#0a0f24] border-r border-[#1a2544] transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* ── Brand ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1a2544]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/15">
          <Shield className="text-cyan-400" size={20} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <span className="block text-sm font-bold text-white tracking-wide">
              Mini-SIEM
            </span>
            <span className="block text-[10px] text-gray-500">
              Security Operations
            </span>
          </div>
        )}
      </div>

      {/* ── Nav Sections ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.items.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={18} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-auto flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* ── Data Sources ───────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-[#1a2544]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Data Sources
          </p>
          <ul className="space-y-1.5">
            {dataSources.map((ds) => (
              <li key={ds.name} className="flex items-center gap-2 text-xs text-gray-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    ds.connected ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                {ds.name}
                <span className="ml-auto text-[10px] text-gray-600">
                  {ds.connected ? 'Connected' : 'Offline'}
                </span>
              </li>
            ))}
          </ul>
          <button className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
            View all sources →
          </button>
        </div>
      )}
    </nav>
  );
}

export default Sidebar;
