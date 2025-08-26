import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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
    const { booking_id, booking_code, amount_cents, currency = 'usd', breakdown } = await req.json()

    if ((!booking_id && !booking_code) || !amount_cents) {
      return new Response(
        JSON.stringify({ error: 'booking_id/booking_code and amount_cents are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from auth header if available
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    let user = null
    if (authHeader) {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser(authHeader)
      user = authUser
    }

    let booking = null

    // Get booking details by booking_code or booking_id
    if (booking_code) {
      const { data: bookingData, error: bookingError } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          passengers (
            id,
            full_name,
            email
          )
        `)
        .eq('booking_code', booking_code)
        .single()

      if (bookingError || !bookingData) {
        return new Response(
          JSON.stringify({ error: 'Booking not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      booking = bookingData
    } else {
      // Existing booking_id logic
      const { data: bookingData, error: bookingError } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          passengers (
            id,
            full_name,
            email
          )
        `)
        .eq('id', booking_id)
        .single()

      if (bookingError || !bookingData) {
        return new Response(
          JSON.stringify({ error: 'Booking not found or access denied' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      booking = bookingData
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Get the origin for return URLs
    const origin = req.headers.get('origin') || 'http://localhost:8080'

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Booking ${booking.booking_code || booking.id.slice(-8).toUpperCase()}`,
              description: `${booking.pickup_location} to ${booking.dropoff_location}`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/passenger/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/passenger/dashboard`,
      metadata: {
        booking_id: booking.id,
        booking_code: booking.booking_code || '',
        passenger_id: booking.passenger_id,
        amount_cents: amount_cents.toString(),
      },
    })

    // Update booking status to awaiting payment
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        payment_status: 'processing',
        payment_confirmation_status: 'awaiting_payment',
        stripe_payment_intent_id: session.id,
        final_price_cents: amount_cents,
        final_price: amount_cents / 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error updating booking:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
