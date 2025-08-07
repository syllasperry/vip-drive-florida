
import { supabase } from '@/integrations/supabase/client';
import { getRideStatusSummary as getRideStatusFromManager, createRideStatusEntry } from './rideStatusManager';

// Use the ride status manager for consistent status handling
export const getRideStatusSummary = getRideStatusFromManager;

// Utiliza a função SQL get_ride_timeline se existir, senão usa booking_status_history
export const getRideTimeline = async (rideId: string) => {
  try {
    console.log('📈 Getting ride timeline for:', rideId);
    
    // Try to use the SQL function first if it exists
    const { data: sqlData, error: sqlError } = await supabase.rpc('get_ride_timeline', {
      p_ride_id: rideId
    });

    // If SQL function works, use it
    if (!sqlError && sqlData) {
      return sqlData;
    }

    console.log('📋 SQL function not available, using booking_status_history table');
    
    // Fallback to using booking_status_history table directly
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', rideId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error getting ride timeline:', error);
      throw error;
    }

    // Transform data to match expected format
    return (data || []).map(entry => ({
      status_code: entry.status,
      status_label: entry.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      actor_role: entry.role || 'system',
      status_timestamp: entry.created_at || entry.updated_at,
      metadata: entry.metadata || {}
    }));

  } catch (error) {
    console.error('❌ Error in getRideTimeline:', error);
    throw error;
  }
};

// Use existing drivers table for matching drivers
export const findMatchingDrivers = async (vehicleMake: string, vehicleModel: string) => {
  try {
    console.log('🚗 Finding matching drivers for:', vehicleMake, vehicleModel);
    
    const { data, error } = await supabase
      .from('drivers')
      .select('id, full_name, email, phone, car_make, car_model')
      .ilike('car_make', `%${vehicleMake}%`)
      .ilike('car_model', `%${vehicleModel}%`);

    if (error) {
      console.error('❌ Error finding matching drivers:', error);
      throw error;
    }

    console.log('✅ Found matching drivers:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in findMatchingDrivers:', error);
    throw error;
  }
};

// Helper para atualizar booking com timestamp automático
export const updateBookingStatus = async (bookingId: string, updates: Record<string, any>) => {
  try {
    console.log('🔄 Updating booking status:', bookingId, updates);
    
    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating booking:', error);
      throw error;
    }

    console.log('✅ Booking status updated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in updateBookingStatus:', error);
    throw error;
  }
};

// Helper para criar entrada no booking_status_history (substitui ride_status)
export const createRideStatus = async (statusData: {
  ride_id: string;
  actor_role: string;
  status_code: string;
  status_label: string;
  metadata?: Record<string, any>;
}) => {
  try {
    console.log('📝 Creating ride status entry:', statusData);
    
    return await createRideStatusEntry(
      statusData.ride_id,
      statusData.status_code,
      statusData.actor_role as 'driver' | 'passenger' | 'system',
      {
        message: statusData.status_label,
        ...statusData.metadata
      }
    );
  } catch (error) {
    console.error('❌ Error creating ride status:', error);
    throw error;
  }
};

// Helper para gerenciar notificações - usando messages table como alternativa
export const createNotification = async (notificationData: {
  booking_id: string;
  recipient_passenger_id?: string;
  recipient_driver_id?: string;
  type: string;
  payload: Record<string, any>;
}) => {
  try {
    console.log('📢 Creating notification:', notificationData);
    
    const recipient_id = notificationData.recipient_passenger_id || notificationData.recipient_driver_id;
    
    if (!recipient_id) {
      throw new Error('No recipient specified for notification');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        booking_id: notificationData.booking_id,
        sender_id: recipient_id,
        sender_type: 'system',
        message_text: `Notification: ${notificationData.type} - ${JSON.stringify(notificationData.payload)}`
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }

    console.log('✅ Notification created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in createNotification:', error);
    throw error;
  }
};

// Helper para verificar se usuário possui a booking
export const userOwnsBooking = async (bookingId: string) => {
  try {
    console.log('🔒 Checking booking ownership:', bookingId);
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from('bookings')
      .select('passenger_id, driver_id')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('❌ Error checking booking ownership:', error);
      return false;
    }

    const owns = data.passenger_id === user.user.id || data.driver_id === user.user.id;
    console.log('✅ User owns booking:', owns);
    return owns;
  } catch (error) {
    console.error('❌ Error in userOwnsBooking:', error);
    return false;
  }
};
