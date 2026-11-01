import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Monitor, AlertTriangle, BarChart3, Zap, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Monitor,
    title: 'Log Monitoring',
    desc: 'Collect and normalize security logs from Windows, Firewall, DNS, EDR, and CloudTrail sources.',
  },
  {
    icon: AlertTriangle,
    title: 'Rule-Based Detection',
    desc: 'Apply configurable thresholds and correlation rules to identify threats in real time.',
  },
  {
    icon: Zap,
    title: 'Alert Management',
    desc: 'Track, triage, and resolve security alerts with a complete investigation workflow.',
  },
  {
    icon: BarChart3,
    title: 'Security Analytics',
    desc: 'Visualize attack patterns, severity trends, and system health with interactive dashboards.',
  },
];

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary text-white relative overflow-hidden">
      {/* ── Animated background ────────────────────────── */}
      <div className="absolute inset-0 animate-network opacity-60" />
      {/* Radial glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,180,216,0.08) 0%, transparent 70%)',
        }}
      />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/15 animate-pulse-glow">
            <Shield className="text-cyan-400" size={28} />
          </div>
          <span className="text-2xl font-bold tracking-wide">
            Mini<span className="text-cyan-400">-SIEM</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-center mb-6 leading-tight animate-fade-in animate-delay-1">
          See Every Threat.<br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Secure Every Layer.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="max-w-2xl text-center text-lg md:text-xl text-gray-400 mb-10 animate-fade-in animate-delay-2">
          Centralized security-event monitoring and rule-based threat detection
          for a professional SOC dashboard experience.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animate-delay-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-glow flex items-center gap-2"
          >
            Launch Dashboard
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3 rounded-lg font-semibold text-gray-300 border border-[#1a2544] hover:border-cyan-500/30 hover:text-white transition-all duration-300"
          >
            Explore Features
          </button>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section
        id="features"
        className="relative z-10 max-w-6xl mx-auto px-4 pb-24"
      >
        <h2 className="text-center text-2xl font-bold mb-12 text-white">
          Platform <span className="text-cyan-400">Capabilities</span>
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`soc-card p-6 group hover:border-cyan-500/20 transition-all duration-300 animate-fade-in`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <f.icon className="text-cyan-400" size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="relative z-10 py-6 text-center text-xs text-gray-600 border-t border-[#1a2544]">
        © 2026 Mini-SIEM · Educational Security Dashboard
      </footer>
    </div>
  );
}

export default LandingPage;
