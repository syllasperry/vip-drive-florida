
import { supabase } from '@/integrations/supabase/client';

// Utiliza a função SQL get_ride_status_summary
export const getRideStatusSummary = async (rideId: string) => {
  const { data, error } = await supabase.rpc('get_ride_status_summary', {
    p_ride_id: rideId
  });

  if (error) {
    console.error('Error getting ride status summary:', error);
    throw error;
  }

  return data;
};

// Utiliza a função SQL get_ride_timeline
export const getRideTimeline = async (rideId: string) => {
  const { data, error } = await supabase.rpc('get_ride_timeline', {
    p_ride_id: rideId
  });

  if (error) {
    console.error('Error getting ride timeline:', error);
    throw error;
  }

  return data;
};

// Utiliza a função SQL find_matching_drivers
export const findMatchingDrivers = async (vehicleMake: string, vehicleModel: string) => {
  const { data, error } = await supabase.rpc('find_matching_drivers', {
    p_vehicle_make: vehicleMake,
    p_vehicle_model: vehicleModel
  });

  if (error) {
    console.error('Error finding matching drivers:', error);
    throw error;
  }

  return data;
};

// Helper para atualizar booking com timestamp automático
export const updateBookingStatus = async (bookingId: string, updates: Record<string, any>) => {
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
    console.error('Error updating booking:', error);
    throw error;
  }

  return data;
};

// Helper para criar entrada no ride_status
export const createRideStatus = async (statusData: {
  ride_id: string;
  actor_role: string;
  status_code: string;
  status_label: string;
  metadata?: Record<string, any>;
}) => {
  const { data, error } = await supabase
    .from('ride_status')
    .insert({
      ...statusData,
      status_timestamp: new Date().toISOString(),
      metadata: statusData.metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating ride status:', error);
    throw error;
  }

  return data;
};

// Helper para gerenciar notificações - usando messages table como alternativa
export const createNotification = async (notificationData: {
  booking_id: string;
  recipient_passenger_id?: string;
  recipient_driver_id?: string;
  type: string;
  payload: Record<string, any>;
}) => {
  // Since notification_outbox doesn't exist, we'll create a message instead
  const recipient_id = notificationData.recipient_passenger_id || notificationData.recipient_driver_id;
  
  if (!recipient_id) {
    throw new Error('No recipient specified for notification');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      booking_id: notificationData.booking_id,
      sender_id: recipient_id, // System message
      sender_type: 'system',
      message_text: `Notification: ${notificationData.type} - ${JSON.stringify(notificationData.payload)}`
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data;
};

// Helper para verificar se usuário possui a booking (utiliza função SQL)
export const userOwnsBooking = async (bookingId: string) => {
  const { data, error } = await supabase.rpc('user_owns_booking', {
    booking_id: bookingId
  });

  if (error) {
    console.error('Error checking booking ownership:', error);
    throw error;
  }

  return data;
};
