
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

  // Real-time subscription for status updates with enhanced coordination
  useEffect(() => {
    if (!rideId || !enabled) return;

    console.log('📡 Setting up enhanced real-time subscription for ride status:', rideId);

    const channel = supabase
      .channel(`ride-status-${rideId}-${userType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_status_history',
          filter: `booking_id=eq.${rideId}`
        },
        (payload) => {
          console.log('📡 Real-time ride status update (history):', payload);
          fetchStatus(); // Refresh data when status history changes
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
  }, [rideId, enabled, userType]);

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

  // Get current status for timeline display
  const getCurrentTimelineStatus = (): string => {
    if (!statusData) return 'pending';
    
    // Priority-based status mapping for timeline
    if (statusData.current_status === 'all_set') return 'all_set';
    if (statusData.current_status.includes('payment') || statusData.current_status === 'passenger_paid') return 'payment_confirmed';
    if (statusData.current_status === 'offer_accepted') return 'offer_accepted';
    if (statusData.current_status === 'offer_sent') return 'offer_sent';
    
    return 'pending';
  };

  return {
    statusData: statusData ? {
      ...statusData,
      current_status: getCurrentTimelineStatus()
    } : null,
    loading,
    error,
    refresh: fetchStatus,
    currentTimelineStatus: getCurrentTimelineStatus(),
    ...getFormattedStatuses()
  };
};
