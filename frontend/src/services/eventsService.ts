import { get } from './api';

export interface EventItem {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp?: string;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  details: string;
}

export const fetchEvents = async (): Promise<EventItem[]> => {
  // TODO: verify endpoint response shape
  return await get<EventItem[]>('/events');
};

