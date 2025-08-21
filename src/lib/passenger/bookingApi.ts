
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CreateBookingData {
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle_type: string;
  passenger_count: number;
  luggage_count: number;
  flight_info?: string;
}

export const createPassengerBooking = async (bookingData: CreateBookingData) => {
  try {
    console.log('🔄 Creating passenger booking with data:', bookingData);
    
    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get passenger profile to ensure passenger exists
    const { data: passenger, error: passengerError } = await supabase
      .from('passengers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (passengerError || !passenger) {
      throw new Error('Passenger profile not found. Please complete your profile first.');
    }

    // Prepare booking data for insertion
    const bookingInsertData = {
      passenger_id: passenger.id,
      pickup_location: bookingData.pickup_location,
      dropoff_location: bookingData.dropoff_location,
      pickup_time: bookingData.pickup_time,
      vehicle_type: bookingData.vehicle_type,
      passenger_count: bookingData.passenger_count,
      luggage_count: bookingData.luggage_count,
      flight_info: bookingData.flight_info || '',
      status: 'pending',
      payment_status: 'pending',
      ride_status: 'pending_driver',
      payment_confirmation_status: 'waiting_for_offer',
      status_passenger: 'passenger_requested',
      status_driver: 'new_request'
    };

    console.log('📝 Inserting booking with data:', bookingInsertData);

    // Create the booking
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingInsertData])
      .select(`
        *,
        passengers (
          id,
          full_name,
          phone,
          profile_photo_url,
          email
        )
      `)
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError);
      throw bookingError;
    }

    console.log('✅ Booking created successfully:', newBooking);
    return newBooking;

  } catch (error) {
    console.error('❌ Error in createPassengerBooking:', error);
    throw error;
  }
};
