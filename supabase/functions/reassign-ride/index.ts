
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

    console.log('🔄 Starting manual reassignment for booking:', bookingId);

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

    // Find all available drivers (dispatcher will choose manually)
    const { data: availableDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, full_name, car_make, car_model')
      .eq('status', 'active');

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

    // DO NOT AUTO-ASSIGN - Let dispatcher choose manually
    console.log('✅ Available drivers found, awaiting manual dispatcher assignment');

    // Update booking to show it needs manual assignment
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        ride_status: 'awaiting_dispatcher_assignment',
        driver_id: null, // Keep null until dispatcher manually assigns
        payment_confirmation_status: 'waiting_for_dispatcher',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update booking status' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send notification to dispatcher (system message)
    await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: booking.passenger_id,
        sender_type: 'system',
        message_text: `New ride request requires dispatcher assignment. From: ${booking.pickup_location} To: ${booking.dropoff_location}. ${availableDrivers.length} drivers available.`
      });

    console.log('✅ Booking marked for manual dispatcher assignment');

    return new Response(
      JSON.stringify({ 
        message: 'Booking awaiting manual dispatcher assignment',
        availableDriversCount: availableDrivers.length,
        status: 'awaiting_dispatcher_assignment'
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
