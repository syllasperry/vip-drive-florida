import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const RideStatus = {
  // Passenger actions
  REQUESTED: 'ride_requested',
  CANCELLED_BY_PASSENGER: 'cancelled_by_passenger',
  
  // Driver actions
  ACCEPTED_BY_DRIVER: 'accepted_by_driver',
  OFFER_SENT: 'offer_sent',
  CANCELLED_BY_DRIVER: 'cancelled_by_driver',
  
  // Passenger response to offer
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_DECLINED: 'offer_declined',
  
  // Final confirmation
  ALL_SET: 'all_set'
} as const;

export type RideStatusType = typeof RideStatus[keyof typeof RideStatus];

interface UseRideStatusSyncOptions {
  bookingId: string | null;
  userType: 'driver' | 'passenger';
  enabled?: boolean;
}

export const useRideStatusSync = ({ bookingId, userType, enabled = true }: UseRideStatusSyncOptions) => {
  const [rideStatus, setRideStatus] = useState<RideStatusType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current status
  const fetchStatus = async () => {
    if (!bookingId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('ride_status')
        .eq('id', bookingId)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.ride_status) {
        setRideStatus(data.ride_status as RideStatusType);
      }
    } catch (err) {
      console.error('Error fetching ride status:', err);
      setError('Failed to fetch ride status');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!bookingId || !enabled) return;

    fetchStatus();

    const channel = supabase
      .channel(`ride-status-sync-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('🔄 Ride status updated:', payload.new.ride_status);
          setRideStatus(payload.new.ride_status as RideStatusType);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, enabled]);

  // Get status message for current user type
  const getStatusMessage = (): { primary: string; secondary: string; status: 'waiting' | 'active' | 'completed' } => {
    if (!rideStatus) return { primary: 'Loading...', secondary: '', status: 'waiting' };

    if (userType === 'passenger') {
      switch (rideStatus) {
        case RideStatus.REQUESTED:
          return { primary: 'Ride Requested', secondary: 'Waiting for driver to respond...', status: 'waiting' };
        case RideStatus.ACCEPTED_BY_DRIVER:
          return { primary: 'Driver Accepted', secondary: 'Driver is preparing your offer...', status: 'active' };
        case RideStatus.OFFER_SENT:
          return { primary: 'Offer Received', secondary: 'Review and confirm your ride', status: 'active' };
        case RideStatus.OFFER_ACCEPTED:
          return { primary: 'Offer Accepted', secondary: 'Finalizing your ride...', status: 'active' };
        case RideStatus.ALL_SET:
          return { primary: '✅ All Set!', secondary: 'Your ride is confirmed', status: 'completed' };
        case RideStatus.CANCELLED_BY_DRIVER:
          return { primary: 'Ride Cancelled', secondary: 'Driver cancelled this ride', status: 'waiting' };
        case RideStatus.CANCELLED_BY_PASSENGER:
          return { primary: 'Ride Cancelled', secondary: 'You cancelled this ride', status: 'waiting' };
        default:
          return { primary: 'Status Unknown', secondary: '', status: 'waiting' };
      }
    } else {
      // Driver perspective
      switch (rideStatus) {
        case RideStatus.REQUESTED:
          return { primary: 'New Ride Request', secondary: 'Please respond to the request', status: 'waiting' };
        case RideStatus.ACCEPTED_BY_DRIVER:
          return { primary: 'Ride Accepted', secondary: 'Now send your offer', status: 'active' };
        case RideStatus.OFFER_SENT:
          return { primary: 'Offer Sent', secondary: 'Waiting for passenger confirmation', status: 'waiting' };
        case RideStatus.OFFER_ACCEPTED:
          return { primary: 'Passenger Confirmed', secondary: 'Ride is being finalized...', status: 'active' };
        case RideStatus.ALL_SET:
          return { primary: '✅ Ride Confirmed', secondary: 'Ready to go!', status: 'completed' };
        case RideStatus.CANCELLED_BY_DRIVER:
          return { primary: 'Ride Cancelled', secondary: 'You cancelled this ride', status: 'waiting' };
        case RideStatus.CANCELLED_BY_PASSENGER:
          return { primary: 'Ride Cancelled', secondary: 'Passenger cancelled this ride', status: 'waiting' };
        default:
          return { primary: 'Status Unknown', secondary: '', status: 'waiting' };
      }
    }
  };

  return {
    rideStatus,
    loading,
    error,
    refresh: fetchStatus,
    statusMessage: getStatusMessage()
  };
};