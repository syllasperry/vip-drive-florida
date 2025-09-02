
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
    const { booking_id, amount_cents, breakdown } = await req.json()

    if (!booking_id || !amount_cents) {
      return new Response(
        JSON.stringify({ error: 'booking_id and amount_cents are required' }),
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

    // Get booking details
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

    // Verify user owns this booking
    if (booking.passengers?.id !== user.id && booking.passenger_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this booking' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Get the origin for return URLs
    const origin = req.headers.get('origin') || 'http://localhost:8080'

    // CRITICAL FIX: Ensure all metadata values are strings and not null
    const metadataBookingId = booking_id ? booking_id.toString() : ''
    const metadataPassengerId = booking.passenger_id ? booking.passenger_id.toString() : ''
    
    if (!metadataBookingId) {
      console.error('❌ booking_id is missing for metadata')
      return new Response(
        JSON.stringify({ error: 'booking_id is required for metadata' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    if (!metadataPassengerId) {
      console.error('❌ passenger_id is missing for metadata')
      return new Response(
        JSON.stringify({ error: 'passenger_id is required for metadata' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VIP Ride - ${booking.pickup_location} to ${booking.dropoff_location}`,
              description: `Booking ${booking.booking_code || booking.id.slice(-8).toUpperCase()}`,
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: metadataBookingId, // For booking identification
      success_url: `${origin}/payment/success?bookingId=${booking_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel?bookingId=${booking_id}`,
      metadata: {
        booking_id: metadataBookingId,
        passenger_id: metadataPassengerId,
        uber_estimate_cents: breakdown?.uberEstimateCents?.toString() || '0',
        dispatcher_fee_cents: breakdown?.dispatcherFeeCents?.toString() || '0',
        app_fee_cents: breakdown?.appFeeCents?.toString() || '0',
        stripe_fee_cents: breakdown?.stripeFeeCents?.toString() || '0',
        total_cents: amount_cents.toString(),
        booking_code: booking.booking_code || booking.id.slice(-8).toUpperCase(),
        created_at: new Date().toISOString()
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
      .eq('id', booking_id)

    if (updateError) {
      console.error('Error updating booking:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id,
        breakdown: breakdown 
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
