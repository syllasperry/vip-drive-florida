
import { supabase } from '@/integrations/supabase/client';

export interface RideStatusEntry {
  actor_role: string;
  status_code: string;
  status_label: string;
  status_timestamp: string;
  metadata?: Record<string, any>;
}

export interface WriteUnderlinedStatusData {
  ride_id: string;
  current_status: string;
  statuses: RideStatusEntry[];
  last_updated: string;
}

/**
 * Get ride status summary using existing booking_status_history table
 * This replaces the missing get_ride_status_summary SQL function
 */
export const getRideStatusSummary = async (rideId: string): Promise<WriteUnderlinedStatusData> => {
  try {
    console.log('🔍 Getting ride status summary for:', rideId);
    
    // Get the current booking data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', rideId)
      .single();

    if (bookingError) {
      console.error('❌ Error fetching booking:', bookingError);
      throw bookingError;
    }

    // Get status history from booking_status_history table
    const { data: statusHistory, error: historyError } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', rideId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('❌ Error fetching status history:', historyError);
      throw historyError;
    }

    // Transform booking_status_history data to match expected format
    const statuses: RideStatusEntry[] = (statusHistory || []).map(entry => ({
      actor_role: entry.role || 'system',
      status_code: entry.status,
      status_label: formatStatusLabel(entry.status),
      status_timestamp: entry.created_at || entry.updated_at || new Date().toISOString(),
      metadata: entry.metadata || {}
    }));

    // Add current booking status if not in history
    const currentStatus = booking.ride_status || booking.status || 'pending';
    const hasCurrentStatus = statuses.some(s => s.status_code === currentStatus);
    
    if (!hasCurrentStatus) {
      statuses.unshift({
        actor_role: 'system',
        status_code: currentStatus,
        status_label: formatStatusLabel(currentStatus),
        status_timestamp: booking.updated_at || booking.created_at,
        metadata: {
          status_passenger: booking.status_passenger,
          status_driver: booking.status_driver,
          ride_status: booking.ride_status,
          payment_confirmation_status: booking.payment_confirmation_status
        }
      });
    }

    return {
      ride_id: rideId,
      current_status: currentStatus,
      statuses: statuses,
      last_updated: booking.updated_at || new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in getRideStatusSummary:', error);
    throw error;
  }
};

/**
 * Format status codes into human-readable labels
 */
const formatStatusLabel = (statusCode: string): string => {
  const statusLabels: Record<string, string> = {
    'pending': 'Ride Requested',
    'pending_driver': 'Waiting for Driver',
    'driver_accepted': 'Driver Accepted',
    'accepted_by_driver': 'Driver Accepted',
    'offer_sent': 'Offer Sent',
    'offer_accepted': 'Offer Accepted',
    'payment_confirmed': 'Payment Confirmed',
    'passenger_paid': 'Payment Received',
    'all_set': 'All Set - Ready to Go',
    'driver_heading_to_pickup': 'Driver En Route',
    'passenger_onboard': 'Ride Started',
    'in_transit': 'In Transit',
    'completed': 'Ride Completed',
    'cancelled': 'Ride Cancelled',
    'expired': 'Offer Expired'
  };

  return statusLabels[statusCode] || statusCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Create ride status entry in booking_status_history table
 */
export const createRideStatusEntry = async (
  rideId: string,
  statusCode: string,
  actorRole: 'driver' | 'passenger' | 'system' = 'system',
  metadata: Record<string, any> = {}
) => {
  try {
    const { data, error } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: rideId,
        status: statusCode,
        role: actorRole,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
        metadata: {
          message: formatStatusLabel(statusCode),
          ...metadata
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating ride status entry:', error);
      throw error;
    }

    console.log('✅ Ride status entry created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in createRideStatusEntry:', error);
    throw error;
  }
};

/**
 * Update booking status and create history entry
 */
export const updateBookingWithStatus = async (
  bookingId: string,
  updates: Record<string, any>,
  actorRole: 'driver' | 'passenger' | 'system' = 'system'
) => {
  try {
    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      throw updateError;
    }

    // Create status history entry if status changed
    if (updates.status || updates.ride_status) {
      await createRideStatusEntry(
        bookingId,
        updates.status || updates.ride_status,
        actorRole,
        {
          previous_status: updates.previous_status,
          status_passenger: updates.status_passenger,
          status_driver: updates.status_driver,
          payment_confirmation_status: updates.payment_confirmation_status
        }
      );
    }

    console.log('✅ Booking updated with status tracking:', updatedBooking);
    return updatedBooking;
  } catch (error) {
    console.error('❌ Error in updateBookingWithStatus:', error);
    throw error;
  }
};
