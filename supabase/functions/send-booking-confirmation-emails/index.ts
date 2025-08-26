
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { booking_id } = await req.json()
    console.log('📧 Triggering emails for booking:', booking_id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get booking details with passenger and driver info
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        passengers:passenger_id (
          full_name,
          email,
          phone
        ),
        drivers:driver_id (
          full_name,
          email,
          phone,
          car_make,
          car_model,
          car_color,
          license_plate
        )
      `)
      .eq('id', booking_id)
      .single()

    if (error || !booking) {
      console.error('❌ Booking not found:', error)
      return new Response('Booking not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    console.log('✅ Booking found, sending confirmation emails')

    // Here you would integrate with your email service (Resend, SendGrid, etc.)
    // For now, we'll just log the email content
    console.log('📧 Passenger email to:', booking.passengers?.email)
    console.log('📧 Driver email to:', booking.drivers?.email)
    
    // Log successful email trigger
    console.log('✅ Confirmation emails triggered for booking:', booking_id)

    return new Response(
      JSON.stringify({ 
        success: true,
        booking_id,
        passenger_email: booking.passengers?.email,
        driver_email: booking.drivers?.email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in send-booking-confirmation-emails:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
