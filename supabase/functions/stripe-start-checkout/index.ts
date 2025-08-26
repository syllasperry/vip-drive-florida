
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id is required' }),
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: { user } } = await supabaseClient.auth.getUser(authHeader)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get booking details with passenger info
    const { data: booking, error: bookingError } = await supabaseClient
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
      .eq('passenger_id', user.id)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use offer_price_cents as the amount (required by user specification)
    const amountCents = booking.offer_price_cents
    if (!amountCents || amountCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'No valid offer price available for this booking' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Stripe with test mode
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Get the origin for return URLs
    const origin = req.headers.get('origin') || 'http://localhost:8080'
    
    // Get customer email (passenger email or fallback to user email)
    const customerEmail = booking.passengers?.email || user.email

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VIP Ride ${booking.booking_code || booking.id.slice(-8).toUpperCase()}`,
              description: `${booking.pickup_location} → ${booking.dropoff_location}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${origin}/payment/success?booking_id=${booking_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel?booking_id=${booking_id}`,
      metadata: {
        booking_id: booking_id,
        public_id: booking.booking_code || booking.id.slice(-8).toUpperCase(),
        passenger_id: user.id,
        offer_price_cents: amountCents.toString(),
      },
    })

    // Update booking status to indicate payment is in progress
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        payment_status: 'processing',
        stripe_payment_intent_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
    }

    console.log(`✅ Stripe checkout session created for booking ${booking_id}, amount: $${amountCents/100}`)

    return new Response(
      JSON.stringify({ 
        ok: true,
        url: session.url,
        session_id: session.id,
        amount_cents: amountCents
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
