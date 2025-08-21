
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceBreakdown {
  base: number;
  dispatcher_fee: number;
  app_fee: number;
  subtotal: number;
  stripe_pct: number;
  stripe_fixed: number;
  amount_cents: number;
}

function calculateBreakdown(baseUberEstimateCents: number): PriceBreakdown {
  const base = baseUberEstimateCents;
  const dispatcher_fee = Math.round(base * 0.20);
  const app_fee = 1000; // $10 fixed
  const subtotal = base + dispatcher_fee + app_fee;
  
  // Stripe fee gross-up calculation
  const stripe_pct = 0.029;
  const stripe_fixed = 30;
  const amount_cents = Math.ceil((subtotal + stripe_fixed) / (1 - stripe_pct));
  
  return {
    base,
    dispatcher_fee,
    app_fee,
    subtotal,
    stripe_pct,
    stripe_fixed,
    amount_cents
  };
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
      .select('*')
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

    // Get base price (Uber estimate)
    const baseUberEstimateCents = booking.final_price_cents || booking.estimated_price_cents
    if (!baseUberEstimateCents || baseUberEstimateCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'No price available for this booking' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate price breakdown
    const breakdown = calculateBreakdown(baseUberEstimateCents);

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
            currency: 'usd',
            product_data: {
              name: `VIP Ride - ${booking.pickup_location} to ${booking.dropoff_location}`,
              description: `Booking ID: ${booking_id}`,
            },
            unit_amount: breakdown.amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payment/success?bookingId=${booking_id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel?bookingId=${booking_id}`,
      metadata: {
        booking_id: booking_id,
        passenger_id: user.id,
        base: breakdown.base.toString(),
        dispatcher_fee: breakdown.dispatcher_fee.toString(),
        app_fee: breakdown.app_fee.toString(),
        subtotal: breakdown.subtotal.toString(),
        stripe_pct: breakdown.stripe_pct.toString(),
        stripe_fixed: breakdown.stripe_fixed.toString(),
        amount_cents: breakdown.amount_cents.toString(),
      },
    })

    return new Response(
      JSON.stringify({ 
        ok: true,
        url: session.url,
        breakdown 
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
