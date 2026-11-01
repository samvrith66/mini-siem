import { get, patch } from './api';

export type AlertStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE' | 'CLOSED';
export const VALID_ALERT_STATUSES: AlertStatus[] = [
  'OPEN',
  'INVESTIGATING',
  'RESOLVED',
  'FALSE_POSITIVE',
  'CLOSED',
];

export interface BackendAlertRow {
  id: number;
  timestamp: string;
  rule_id: string;
  rule_name: string;
  severity: string;
  description: string;
  status: string;
  source_ip?: string | null;
  destination_ip?: string | null;
  event_count: number;
  details?: any;
  mitigation_hint?: string | null;
}

export interface AlertsApiResponse {
  alerts: BackendAlertRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface AlertItem {
  id: string | number;
  timestamp: string;
  rule_id: string;
  rule_name: string;
  title: string;
  severity: string;
  description: string;
  status: string;
  source_ip?: string;
  destination_ip?: string;
  event_count: number;
  details?: any;
  mitigation_hint?: string;
}

export const mapBackendAlert = (row: BackendAlertRow): AlertItem => ({
  id: row.id,
  timestamp: row.timestamp,
  rule_id: row.rule_id,
  rule_name: row.rule_name,
  title: row.rule_name || row.description,
  severity: row.severity,
  description: row.description,
  status: row.status,
  source_ip: row.source_ip || undefined,
  destination_ip: row.destination_ip || undefined,
  event_count: row.event_count,
  details: row.details,
  mitigation_hint: row.mitigation_hint || undefined,
});

export const fetchAlertsPaginated = async (params?: Record<string, any>) => {
  const data = await get<AlertsApiResponse>('/alerts', params);
  const rows = data && Array.isArray(data.alerts) ? data.alerts : [];
  return {
    alerts: rows.map(mapBackendAlert),
    total: data?.total ?? rows.length,
    limit: data?.limit ?? 50,
    offset: data?.offset ?? 0,
  };
};

export const fetchAlerts = async (params?: Record<string, any>): Promise<AlertItem[]> => {
  const result = await fetchAlertsPaginated(params);
  return result.alerts;
};

export const patchAlertStatus = async (
  id: string | number,
  status: string,
  mitigationHint?: string
): Promise<AlertItem> => {
  const body: { status: string; mitigation_hint?: string } = {
    status: status.toUpperCase(),
  };
  if (mitigationHint) {
    body.mitigation_hint = mitigationHint;
  }
  const res = await patch<{ message: string; alert: BackendAlertRow }>(`/alerts/${id}`, body);
  return mapBackendAlert(res.alert);
};
