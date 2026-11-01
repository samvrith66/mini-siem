import { useCallback, useEffect, useState } from 'react';
import { fetchStats, StatsResponse } from '../services/statsService';

export function useStats() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchStats();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();

    const handleRefresh = () => {
      loadStats();
    };

    window.addEventListener('siem:refresh', handleRefresh);
    return () => {
      window.removeEventListener('siem:refresh', handleRefresh);
    };
  }, [loadStats]);

  return { data, loading, error, refetch: loadStats };
}
