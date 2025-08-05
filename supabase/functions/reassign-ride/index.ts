import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Booking ID is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔄 Starting auto-reassignment for booking:', bookingId);

    // Get the current booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Error fetching booking:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if booking is still pending and assigned to a driver
    if (booking.ride_status !== 'pending_driver' && booking.driver_id !== null) {
      console.log('✅ Booking already processed, skipping reassignment');
      return new Response(
        JSON.stringify({ message: 'Booking already processed' }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find matching drivers who haven't rejected this ride yet
    const { data: availableDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, full_name, car_make, car_model')
      .neq('id', booking.driver_id || 'none') // Exclude current driver
      .ilike('car_make', `%${booking.vehicle_type?.split(' ')[0] || ''}%`)
      .ilike('car_model', `%${booking.vehicle_type?.split(' ')[1] || ''}%`);

    if (driversError || !availableDrivers || availableDrivers.length === 0) {
      console.log('❌ No available drivers found for reassignment');
      
      // Update booking status to indicate no drivers available
      await supabase
        .from('bookings')
        .update({ 
          ride_status: 'no_drivers_available',
          driver_id: null,
          payment_confirmation_status: 'no_drivers_available'
        })
        .eq('id', bookingId);

      // Notify passenger
      await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: booking.passenger_id,
          sender_type: 'system',
          message_text: 'Unfortunately, no drivers are currently available for your ride request. Please try again later or contact support.'
        });

      return new Response(
        JSON.stringify({ message: 'No drivers available for reassignment' }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Select a random available driver (in a real system, you might use a more sophisticated algorithm)
    const randomDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
    
    console.log('🔄 Reassigning to driver:', randomDriver.id, randomDriver.full_name);

    // Update booking with new driver
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        driver_id: randomDriver.id,
        ride_status: 'pending_driver',
        payment_confirmation_status: 'waiting_for_offer',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to reassign booking' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send notification message to the new driver
    await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: randomDriver.id,
        sender_type: 'system',
        message_text: `New ride request assigned to you! From: ${booking.pickup_location} To: ${booking.dropoff_location}. Please review and respond within 10 minutes.`
      });

    // Log the reassignment
    console.log('✅ Successfully reassigned booking', bookingId, 'to driver', randomDriver.id);

    return new Response(
      JSON.stringify({ 
        message: 'Ride successfully reassigned',
        newDriverId: randomDriver.id,
        driverName: randomDriver.full_name
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Reassignment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});