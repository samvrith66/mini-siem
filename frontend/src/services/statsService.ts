import { get } from './api';

export interface StatsResponse {
  totalEvents: number;
  securityAlerts: number;
  criticalThreats: number;
  systemHealth: string;
}

export const fetchStats = async (): Promise<StatsResponse> => {
  // TODO: confirm exact field names from backend
  return await get<StatsResponse>('/stats');
};

