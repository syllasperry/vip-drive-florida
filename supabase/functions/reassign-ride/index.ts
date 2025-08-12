
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

    console.log('🔄 Reassign function called for booking:', bookingId);
    console.log('[AUTO-ASSIGN GUARD] blocked - reassignment function disabled for manual dispatcher control');

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

    // CRITICAL GUARD: Do not automatically reassign drivers
    // The dispatcher must manually assign drivers through the dashboard
    console.log('[AUTO-ASSIGN GUARD] Auto-reassignment blocked - manual assignment required');
    
    // SECURITY GUARD: Verificar payload antes de atualizar
    const updatePayload = { 
      ride_status: 'pending_dispatcher_assignment',
      driver_id: null, // CRITICAL: Never auto-assign driver_id
      payment_confirmation_status: 'awaiting_manual_assignment'
    };
    
    console.log('[GUARD] payload to bookings update:', updatePayload);
    
    // Update booking status to indicate manual assignment needed
    await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId);

    // Notify dispatcher that manual assignment is needed
    await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: booking.passenger_id,
        sender_type: 'system',
        message_text: `Booking ${bookingId.slice(-8).toUpperCase()} requires manual driver assignment by dispatcher. From: ${booking.pickup_location} To: ${booking.dropoff_location}.`
      });

    console.log('✅ Booking marked for manual dispatcher assignment');

    return new Response(
      JSON.stringify({ 
        message: 'Booking marked for manual dispatcher assignment',
        bookingId: bookingId,
        requiresManualAssignment: true
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
