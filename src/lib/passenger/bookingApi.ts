
import { supabase } from '@/integrations/supabase/client';

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

    console.log('✅ User authenticated:', user.id);

    // Get or create passenger profile
    let { data: passenger, error: passengerError } = await supabase
      .from('passengers')
      .select('id, user_id, full_name, email, phone')
      .eq('user_id', user.id)
      .maybeSingle();

    if (passengerError) {
      console.error('❌ Error fetching passenger:', passengerError);
      throw new Error('Failed to fetch passenger profile');
    }

    // If no passenger profile exists, create one
    if (!passenger) {
      console.log('📝 Creating passenger profile for user:', user.id);
      
      const { data: newPassenger, error: createError } = await supabase
        .from('passengers')
        .insert([{
          user_id: user.id,
          full_name: user.email?.split('@')[0] || 'Passenger',
          email: user.email,
          phone: null
        }])
        .select('id, user_id, full_name, email, phone')
        .single();

      if (createError) {
        console.error('❌ Error creating passenger:', createError);
        throw new Error('Failed to create passenger profile');
      }

      passenger = newPassenger;
      console.log('✅ Passenger profile created:', passenger.id);
    } else {
      console.log('✅ Passenger profile found:', passenger.id);
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
