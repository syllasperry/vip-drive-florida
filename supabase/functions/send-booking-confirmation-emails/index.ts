
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { booking_id } = await req.json()

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key for elevated access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get complete booking details with passenger and driver info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        passengers (
          id,
          full_name,
          email,
          phone,
          preferred_temperature,
          music_preference,
          interaction_preference,
          trip_purpose,
          additional_notes
        ),
        drivers (
          id,
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

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError)
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📧 Processing booking confirmation emails for:', booking.id)

    const finalPrice = booking.final_price_cents 
      ? (booking.final_price_cents / 100).toFixed(2)
      : booking.final_price?.toFixed(2) || '0.00'

    const pickupDate = new Date(booking.pickup_time).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const pickupTime = new Date(booking.pickup_time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Prepare email data for outbox
    const emailData = {
      booking_id: booking.id,
      booking_code: booking.booking_code || booking.id.slice(-8).toUpperCase(),
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      final_price: finalPrice,
      passenger: {
        name: booking.passengers?.full_name || 'Passenger',
        email: booking.passengers?.email || '',
        phone: booking.passengers?.phone || '',
        preferences: {
          temperature: booking.passengers?.preferred_temperature,
          music: booking.passengers?.music_preference,
          interaction: booking.passengers?.interaction_preference,
          trip_purpose: booking.passengers?.trip_purpose,
          notes: booking.passengers?.additional_notes
        }
      },
      driver: {
        name: booking.drivers?.full_name || 'Driver',
        email: booking.drivers?.email || '',
        phone: booking.drivers?.phone || '',
        vehicle: {
          make: booking.drivers?.car_make,
          model: booking.drivers?.car_model,
          color: booking.drivers?.car_color,
          license_plate: booking.drivers?.license_plate
        }
      }
    }

    // Add passenger confirmation email to outbox
    if (booking.passengers?.email) {
      const { error: passengerEmailError } = await supabaseAdmin
        .from('email_outbox')
        .insert({
          booking_id: booking.id,
          recipient: booking.passengers.email,
          template: 'booking_confirmation_passenger',
          payload: emailData,
          status: 'pending'
        })

      if (passengerEmailError) {
        console.error('Error queuing passenger email:', passengerEmailError)
      } else {
        console.log('✅ Passenger confirmation email queued')
      }
    }

    // Add driver notification email to outbox
    if (booking.drivers?.email) {
      const { error: driverEmailError } = await supabaseAdmin
        .from('email_outbox')
        .insert({
          booking_id: booking.id,
          recipient: booking.drivers.email,
          template: 'booking_confirmation_driver',
          payload: emailData,
          status: 'pending'
        })

      if (driverEmailError) {
        console.error('Error queuing driver email:', driverEmailError)
      } else {
        console.log('✅ Driver notification email queued')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Booking confirmation emails queued successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-booking-confirmation-emails:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process booking confirmation emails' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
