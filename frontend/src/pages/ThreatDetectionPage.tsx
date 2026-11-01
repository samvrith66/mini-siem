import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  fetchSimulationScenarios,
  runSimulation,
  ScenarioItem,
  SimulationResult,
} from '../services/simulationService';
import {
  Play,
  Crosshair,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Zap,
} from 'lucide-react';

const categoryColor: Record<string, string> = {
  'Credential Access': 'text-red-400 bg-red-500/10 border-red-500/20',
  Reconnaissance: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Privilege Escalation': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Execution & C2': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Impact: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'Initial Access': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Routine Operations': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
};

const ThreatDetectionPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await fetchSimulationScenarios();
      setScenarios(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load attack simulation scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const handleExecute = async (scenarioId: string) => {
    try {
      setRunningId(scenarioId);
      setError(null);
      const res = await runSimulation(scenarioId);
      setLastResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Simulation execution failed');
    } finally {
      setRunningId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Crosshair className="text-cyan-400" size={22} />
              Threat Detection &amp; Simulation Lab
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Trigger realistic adversary tradecraft scenarios against the live detection engine
            </p>
          </div>

          <button
            onClick={loadScenarios}
            disabled={loading}
            className="p-2 bg-[#0f1629] border border-[#1a2544] hover:border-cyan-500/30 text-gray-400 hover:text-cyan-400 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
            <span>Refresh Scenarios</span>
          </button>
        </div>

        {/* Status / Last Result Banner */}
        {lastResult && (
          <div className="soc-card p-4 border-l-4 border-l-cyan-400 bg-cyan-950/20">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-cyan-400 mt-0.5" size={18} />
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {lastResult.scenario?.name || 'Scenario Executed'}
                  </h4>
                  <p className="text-xs text-gray-300 mt-0.5">{lastResult.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-gray-400">
                      Events Ingested: <strong className="text-white">{lastResult.events_generated}</strong>
                    </span>
                    <span className="text-gray-400">
                      Alerts Fired: <strong className="text-cyan-300">{lastResult.alerts_triggered?.length || 0}</strong>
                    </span>
                  </div>
                  {lastResult.alerts_triggered && lastResult.alerts_triggered.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {lastResult.alerts_triggered.map((al, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-gray-300">
                          <AlertTriangle size={12} className="text-red-400 shrink-0" />
                          <span className="font-semibold text-white">[{al.severity}]</span>
                          <span>{al.rule_name || al.description}</span>
                          <span className="text-gray-500">(count: {al.event_count})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setLastResult(null)}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Scenarios Grid */}
        {loading && scenarios.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <RefreshCw className="animate-spin mx-auto mb-2 text-cyan-400" size={28} />
            <p className="text-sm">Loading detection scenarios from SIEM API...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((sc) => {
              const isExecuting = runningId === sc.id;
              const catClass = categoryColor[sc.category] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
              return (
                <div
                  key={sc.id}
                  className="soc-card p-5 flex flex-col justify-between hover:border-cyan-500/30 transition-all group"
                >
                  <div>
                    {/* Header: MITRE badge & Category */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catClass}`}>
                        {sc.category}
                      </span>
                      {sc.mitre_id && sc.mitre_id !== 'N/A' && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                          MITRE {sc.mitre_id}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {sc.name}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      {sc.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1a2544] flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      ~{sc.default_count} events
                    </span>

                    <button
                      disabled={isExecuting || !!runningId}
                      onClick={() => handleExecute(sc.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Simulating...</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} fill="currentColor" />
                          <span>Run Scenario</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ThreatDetectionPage;
