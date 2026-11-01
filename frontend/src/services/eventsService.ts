import { get } from './api';

export interface BackendEventRow {
  id: number;
  timestamp: string;
  source_ip: string;
  destination_ip?: string | null;
  source_port?: number | null;
  destination_port?: number | null;
  protocol?: string;
  event_type: string;
  severity: string;
  user?: string | null;
  message?: string | null;
  raw_data?: any;
}

export interface EventsApiResponse {
  events: BackendEventRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface EventItem {
  id: string | number;
  timestamp: string;
  sourceIp: string;
  source_ip: string;
  destinationIp?: string;
  destination_ip?: string;
  sourcePort?: number;
  source_port?: number;
  destinationPort?: number;
  destination_port?: number;
  protocol?: string;
  type: string;
  event_type: string;
  severity: string;
  user?: string;
  message?: string;
  details: string;
  raw_data?: any;
}

export interface PaginatedEvents {
  events: EventItem[];
  total: number;
  limit: number;
  offset: number;
}

export const mapBackendEvent = (raw: BackendEventRow): EventItem => {
  const details = raw.message || (raw.raw_data ? (typeof raw.raw_data === 'object' ? JSON.stringify(raw.raw_data) : String(raw.raw_data)) : raw.event_type);
  return {
    id: raw.id,
    timestamp: raw.timestamp,
    sourceIp: raw.source_ip || '-',
    source_ip: raw.source_ip || '-',
    destinationIp: raw.destination_ip || undefined,
    destination_ip: raw.destination_ip || undefined,
    sourcePort: raw.source_port ?? undefined,
    source_port: raw.source_port ?? undefined,
    destinationPort: raw.destination_port ?? undefined,
    destination_port: raw.destination_port ?? undefined,
    protocol: raw.protocol || 'TCP',
    type: raw.event_type || 'unknown',
    event_type: raw.event_type || 'unknown',
    severity: raw.severity || 'INFO',
    user: raw.user || undefined,
    message: raw.message || undefined,
    details,
    raw_data: raw.raw_data,
  };
};

export const fetchEventsPaginated = async (params?: Record<string, any>): Promise<PaginatedEvents> => {
  const data = await get<EventsApiResponse>('/events', params);
  const rawEvents = data && Array.isArray(data.events) ? data.events : [];
  return {
    events: rawEvents.map(mapBackendEvent),
    total: data?.total ?? rawEvents.length,
    limit: data?.limit ?? 50,
    offset: data?.offset ?? 0,
  };
};

export const fetchEvents = async (params?: Record<string, any>): Promise<EventItem[]> => {
  const result = await fetchEventsPaginated(params);
  return result.events;
};
