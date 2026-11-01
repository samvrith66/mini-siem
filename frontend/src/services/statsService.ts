import { get } from './api';

export interface SeverityDistribution {
  events: {
    CRITICAL?: number;
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
    INFO?: number;
    [key: string]: number | undefined;
  };
  alerts: {
    CRITICAL?: number;
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
    [key: string]: number | undefined;
  };
}

export interface StatsResponse {
  total_events: number;
  events_last_24h: number;
  total_alerts: number;
  alerts_last_24h: number;
  open_alerts: number;
  investigating_alerts: number;
  resolved_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  severity_distribution: SeverityDistribution;

  // Convenience camelCase aliases for components that might use them
  totalEvents?: number;
  securityAlerts?: number;
  criticalThreats?: number;
  systemHealth?: string;
}

export interface TimelineBucket {
  hour: string;
  events: number;
  alerts: number;
}

export interface TimelineResponse {
  timeline: TimelineBucket[];
}

export interface EventTypeCount {
  event_type: string;
  count: number;
}

export interface EventTypesResponse {
  event_types: EventTypeCount[];
}

export interface TopIpItem {
  ip: string;
  count: number;
}

export interface TopIpsResponse {
  top_source_ips: TopIpItem[];
  top_destination_ips: TopIpItem[];
}

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  timestamp: string;
  blueprints: string[];
}

export const fetchStats = async (): Promise<StatsResponse> => {
  const data = await get<StatsResponse>('/stats');
  return {
    ...data,
    totalEvents: data.total_events,
    securityAlerts: data.total_alerts,
    criticalThreats: data.critical_alerts,
    systemHealth: 'Operational',
  };
};

export const fetchTimeline = async (): Promise<TimelineResponse> => {
  return await get<TimelineResponse>('/stats/timeline');
};

export const fetchTopEventTypes = async (): Promise<EventTypesResponse> => {
  return await get<EventTypesResponse>('/stats/event-types');
};

export const fetchTopIps = async (): Promise<TopIpsResponse> => {
  return await get<TopIpsResponse>('/stats/top-ips');
};

export const fetchHealth = async (): Promise<HealthResponse> => {
  return await get<HealthResponse>('/health');
};
