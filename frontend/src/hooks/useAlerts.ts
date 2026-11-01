import { useCallback, useEffect, useState } from 'react';
import {
  fetchAlerts,
  patchAlertStatus,
  AlertItem,
  VALID_ALERT_STATUSES,
} from '../services/alertsService';

export { type AlertItem, VALID_ALERT_STATUSES };

export function useAlerts(params?: Record<string, any>) {
  const [data, setData] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const alerts = await fetchAlerts(params);
      setData(alerts);
    } catch (e: any) {
      setError(e?.message || 'Failed to load security alerts');
    } finally {
      setLoading(false);
    }
  }, [params ? JSON.stringify(params) : '']);

  useEffect(() => {
    loadAlerts();

    const handleRefresh = () => {
      loadAlerts();
    };

    window.addEventListener('siem:refresh', handleRefresh);
    return () => {
      window.removeEventListener('siem:refresh', handleRefresh);
    };
  }, [loadAlerts]);

  const patchStatus = async (id: string | number, status: string, mitigationHint?: string) => {
    try {
      setError(null);
      const updated = await patchAlertStatus(id, status, mitigationHint);
      setData((prev) =>
        prev.map((a) => (String(a.id) === String(id) ? updated : a))
      );
      // Notify other components (e.g. stats, dashboard) to refresh their metrics
      window.dispatchEvent(new CustomEvent('siem:refresh'));
      return updated;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update alert status';
      setError(msg);
      throw new Error(msg);
    }
  };

  return { data, loading, error, patchStatus, refetch: loadAlerts };
}
