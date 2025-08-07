
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRideStatusSummary, WriteUnderlinedStatusData, RideStatusEntry } from '@/utils/rideStatusManager';

interface UseRideStatusOptions {
  rideId: string | null;
  userType: 'driver' | 'passenger';
  enabled?: boolean;
}

export const useRideStatus = ({ rideId, userType, enabled = true }: UseRideStatusOptions) => {
  const [statusData, setStatusData] = useState<WriteUnderlinedStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch status data
  const fetchStatus = async () => {
    if (!rideId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching ride status for:', rideId);
      const data = await getRideStatusSummary(rideId);
      setStatusData(data);
      console.log('✅ Ride status fetched:', data);
    } catch (err) {
      console.error('❌ Error fetching ride status:', err);
      setError('Failed to fetch ride status');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [rideId, enabled]);

  // Real-time subscription for status updates
  useEffect(() => {
    if (!rideId || !enabled) return;

    console.log('📡 Setting up real-time subscription for ride status:', rideId);

    const channel = supabase
      .channel(`ride-status-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_status_history',
          filter: `booking_id=eq.${rideId}`
        },
        (payload) => {
          console.log('📡 Real-time ride status update:', payload);
          fetchStatus(); // Refresh data when changes occur
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${rideId}`
        },
        (payload) => {
          console.log('📡 Real-time booking update:', payload);
          fetchStatus(); // Refresh data when booking changes
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up ride status subscription');
      supabase.removeChannel(channel);
    };
  }, [rideId, enabled]);

  // Get statuses formatted for the current user type
  const getFormattedStatuses = (): { myStatus: RideStatusEntry | null; otherStatus: RideStatusEntry | null } => {
    if (!statusData?.statuses) {
      return { myStatus: null, otherStatus: null };
    }

    const myRole = userType;
    const otherRole = userType === 'driver' ? 'passenger' : 'driver';

    const myStatus = statusData.statuses.find(s => s.actor_role === myRole) || null;
    const otherStatus = statusData.statuses.find(s => s.actor_role === otherRole) || null;

    return { myStatus, otherStatus };
  };

  return {
    statusData,
    loading,
    error,
    refresh: fetchStatus,
    ...getFormattedStatuses()
  };
};
