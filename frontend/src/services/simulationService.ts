import { get, post } from './api';

export interface ScenarioItem {
  id: string;
  name: string;
  description: string;
  category: string;
  mitre_id: string;
  default_count: number;
}

export interface SimulationResult {
  message: string;
  scenario: ScenarioItem;
  events_generated: number;
  alerts_triggered: any[];
}

export const fetchSimulationScenarios = async (): Promise<ScenarioItem[]> => {
  const data = await get<{ scenarios: ScenarioItem[] }>('/simulate/scenarios');
  return data && Array.isArray(data.scenarios) ? data.scenarios : [];
};

export const runSimulation = async (scenarioId: string): Promise<SimulationResult> => {
  const result = await post<SimulationResult>(`/simulate/${scenarioId}`);
  // Dispatch global event so all dashboards, alerts, and event views refresh their data
  window.dispatchEvent(new CustomEvent('siem:refresh'));
  return result;
};
