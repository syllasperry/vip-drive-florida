
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RideStatusSummary {
  actor_role: string;
  status_code: string;
  status_label: string;
  status_timestamp: string;
  metadata: any;
}

export const useRideStatusSummary = (rideId: string | null) => {
  const [summary, setSummary] = useState<RideStatusSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!rideId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_ride_status_summary', {
        p_ride_id: rideId
      });

      if (error) throw error;
      
      setSummary(data || []);
    } catch (err) {
      console.error('Error fetching ride status summary:', err);
      setError('Failed to fetch ride status summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [rideId]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary
  };
};
