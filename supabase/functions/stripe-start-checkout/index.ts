
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
    console.log('🚀 Starting stripe-start-checkout function')
    
    const { booking_id } = await req.json()
    console.log('📝 Request data:', { booking_id })

    if (!booking_id) {
      console.error('❌ Missing booking_id in request')
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
      console.error('❌ Missing Authorization header')
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
      console.error('❌ Invalid user token')
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ User authenticated:', user.id)

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
      console.error('❌ Booking not found or access denied:', bookingError)
      return new Response(
        JSON.stringify({ error: 'Booking not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📋 Booking found:', {
      id: booking.id,
      offer_price_cents: booking.offer_price_cents,
      passenger_id: booking.passenger_id
    })

    // Critical: Use offer_price_cents as the definitive price source
    const amountCents = booking.offer_price_cents
    if (!amountCents || amountCents <= 0) {
      console.error('❌ Missing or invalid offer_price_cents:', amountCents)
      return new Response(
        JSON.stringify({ error: 'missing_offer_price_cents' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('💰 Using offer_price_cents:', amountCents)

    // Initialize Stripe with secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Stripe configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    console.log('✅ Stripe initialized')

    // Get the origin for return URLs
    const origin = req.headers.get('origin') || 'https://preview--vip-passenger.lovable.app'
    console.log('🌐 Origin for URLs:', origin)
    
    // Get customer email (passenger email or fallback to user email)
    const customerEmail = booking.passengers?.email || user.email

    // Create Stripe Checkout Session
    console.log('🛒 Creating Checkout Session with:', {
      amount: amountCents,
      currency: 'usd',
      customer_email: customerEmail,
      booking_id: booking_id
    })

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

    console.log('✅ Checkout Session created:', session.id)

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
      console.error('⚠️ Error updating booking status:', updateError)
    } else {
      console.log('✅ Booking status updated to processing')
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
    console.error('❌ Error creating checkout session:', error)
    
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    // Return a descriptive error for the frontend
    let errorMessage = 'Failed to create checkout session'
    let statusCode = 500

    if (error?.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe error: ${error.message}`
      statusCode = 400
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      errorMessage = 'Network error - please check your connection'
      statusCode = 503
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
