
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

  const fetchStatus = async () => {
    if (!rideId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching ride status for:', rideId);
      const data = await getRideStatusSummary(rideId);
      
      // Enhanced status mapping for better legacy support
      const enhancedData = {
        ...data,
        current_status: mapLegacyStatus(data.current_status, data.statuses)
      };
      
      setStatusData(enhancedData);
      console.log('✅ Ride status fetched:', enhancedData);
    } catch (err) {
      console.error('❌ Error fetching ride status:', err);
      setError('Failed to fetch ride status');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced legacy status mapping
  const mapLegacyStatus = (currentStatus: string, statuses: RideStatusEntry[]): string => {
    // Check if we have specific status history
    if (statuses && statuses.length > 0) {
      const latestStatus = statuses[statuses.length - 1];
      
      // Map legacy statuses to timeline statuses
      const statusMap: Record<string, string> = {
        'driver_accepted': 'pending',
        'accepted_by_driver': 'pending',
        'passenger_requested': 'pending',
        'ride_requested': 'pending'
      };

      return statusMap[latestStatus.status_code] || latestStatus.status_code;
    }

    // Fallback mapping for direct status
    const fallbackMap: Record<string, string> = {
      'driver_accepted': 'pending',
      'accepted_by_driver': 'pending',
      'passenger_requested': 'pending',
      'ride_requested': 'pending'
    };

    return fallbackMap[currentStatus] || currentStatus;
  };

  useEffect(() => {
    fetchStatus();
  }, [rideId, enabled]);

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
          fetchStatus();
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
          fetchStatus();
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

  const getCurrentTimelineStatus = (): string => {
    if (!statusData) return 'pending';
    
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
