import { useCallback, useEffect, useState } from 'react';
import { fetchEvents, EventItem } from '../services/eventsService';

export function useEvents(params?: Record<string, any>) {
  const [data, setData] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await fetchEvents(params);
      setData(events);
    } catch (e: any) {
      setError(e?.message || 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  }, [params ? JSON.stringify(params) : '']);

  useEffect(() => {
    loadEvents();

    const handleRefresh = () => {
      loadEvents();
    };

    window.addEventListener('siem:refresh', handleRefresh);
    return () => {
      window.removeEventListener('siem:refresh', handleRefresh);
    };
  }, [loadEvents]);

  return { data, loading, error, refetch: loadEvents };
}
