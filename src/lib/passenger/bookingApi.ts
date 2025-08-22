
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

    // Get or create passenger profile with better error handling
    let { data: passenger, error: passengerError } = await supabase
      .from('passengers')
      .select('id, user_id, full_name, email, phone')
      .eq('user_id', user.id)
      .maybeSingle();

    if (passengerError) {
      console.error('❌ Error fetching passenger:', passengerError);
      throw new Error(`Failed to fetch passenger profile: ${passengerError.message}`);
    }

    // If no passenger profile exists, create one with better data
    if (!passenger) {
      console.log('📝 Creating passenger profile for user:', user.id);
      
      const passengerData = {
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Passenger',
        email: user.email,
        phone: user.user_metadata?.phone || null
      };

      const { data: newPassenger, error: createError } = await supabase
        .from('passengers')
        .insert([passengerData])
        .select('id, user_id, full_name, email, phone')
        .single();

      if (createError) {
        console.error('❌ Error creating passenger:', createError);
        throw new Error(`Failed to create passenger profile: ${createError.message}`);
      }

      passenger = newPassenger;
      console.log('✅ Passenger profile created:', passenger.id);
    } else {
      console.log('✅ Passenger profile found:', passenger.id);
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

    // Test the booking creation before actual insert
    const testResult = await bookingDiagnostics.testBookingCreation({
      ...bookingInsertData,
      // Add a test flag to identify this as a test
      flight_info: '__TEST_BOOKING__'
    });

    if (testResult.status === 'error') {
      console.error('❌ Booking creation test failed:', testResult);
      throw new Error(`Booking creation test failed: ${testResult.message}`);
    }

    // If test passed, delete the test booking and create the real one
    if (testResult.details?.id) {
      await supabase.from('bookings').delete().eq('id', testResult.details.id);
    }

    // Create the actual booking
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
