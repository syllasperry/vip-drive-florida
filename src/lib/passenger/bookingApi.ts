
import { supabase } from '@/integrations/supabase/client';
import { BookingStatusManager } from '@/lib/booking/statusMachine';
import { smartPricing } from '@/lib/booking/smartPricing';
import { bookingDiagnostics } from '@/lib/diagnostics/bookingFlow';

export interface CreateBookingData {
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle_type: string;
  passenger_count: number;
  luggage_count: number;
  flight_info?: string;
  distance_miles?: number;
}

export const createPassengerBooking = async (bookingData: CreateBookingData) => {
  try {
    console.log('🔄 Creating passenger booking with data:', bookingData);
    
    // Run pre-flight diagnostics
    const diagnostics = await bookingDiagnostics.runFullDiagnostic();
    const criticalIssues = diagnostics.filter(d => d.status === 'error');
    
    if (criticalIssues.length > 0) {
      console.error('❌ Critical issues detected:', criticalIssues);
      throw new Error(`Pre-flight check failed: ${criticalIssues.map(i => i.message).join(', ')}`);
    }

    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    console.log('✅ User authenticated:', user.id);

    // Use the new helper function to get or create passenger profile
    const { data: passengerId, error: profileError } = await supabase
      .rpc('get_or_create_passenger_profile', {
        p_user_id: user.id
      });

    if (profileError || !passengerId) {
      console.error('❌ Error creating/getting passenger profile:', profileError);
      throw new Error(`Failed to create passenger profile: ${profileError?.message || 'Unknown error'}`);
    }

    console.log('✅ Passenger profile ready:', passengerId);

    // Get the passenger details for the booking
    const { data: passenger, error: passengerFetchError } = await supabase
      .from('passengers')
      .select('id, user_id, full_name, email, phone, profile_photo_url')
      .eq('id', passengerId)
      .single();

    if (passengerFetchError || !passenger) {
      console.error('❌ Error fetching passenger details:', passengerFetchError);
      throw new Error(`Failed to fetch passenger details: ${passengerFetchError?.message || 'Unknown error'}`);
    }

    // Verify passenger ownership
    if (passenger.user_id !== user.id) {
      console.error('❌ Passenger user_id mismatch:', { 
        passenger_user_id: passenger.user_id, 
        auth_user_id: user.id 
      });
      throw new Error('Passenger profile does not belong to authenticated user');
    }

    console.log('✅ Passenger ownership verified');

    // Calculate smart pricing
    const distanceMiles = bookingData.distance_miles || 10; // Default 10 miles if not provided
    const pricingResult = smartPricing.calculatePrice(distanceMiles);
    
    console.log('💰 Smart pricing calculated:', pricingResult);

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
      distance_miles: distanceMiles,
      estimated_price: pricingResult.total,
      estimated_price_cents: pricingResult.total * 100,
      status: BookingStatusManager.normalizeStatus('pending'),
      payment_status: 'pending',
      ride_status: 'pending_driver',
      payment_confirmation_status: 'waiting_for_offer',
      status_passenger: 'passenger_requested',
      status_driver: 'new_request'
    };

    console.log('📝 Inserting booking with data:', bookingInsertData);
    console.log('🔐 Current user context:', { user_id: user.id, passenger_id: passenger.id });

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
      console.error('❌ Booking error details:', {
        code: bookingError.code,
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint
      });
      
      // Provide more specific error messages
      if (bookingError.code === '42501') {
        throw new Error('Permission denied: Unable to create booking. Please check your profile settings.');
      } else if (bookingError.code === '23505') {
        throw new Error('Duplicate booking detected. Please try again.');
      }
      
      throw bookingError;
    }

    console.log('✅ Booking created successfully:', newBooking);
    return newBooking;

  } catch (error) {
    console.error('❌ Error in createPassengerBooking:', error);
    throw error;
  }
};
