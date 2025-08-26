
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

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    console.log('🔔 Webhook received')
    
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return new Response('Missing signature', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured')
      return new Response('Webhook secret not configured', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured')
      return new Response('Stripe not configured', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Verify webhook signature using constructEventAsync for Deno
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return new Response(`Webhook signature verification failed: ${err.message}`, {
        status: 400,
        headers: corsHeaders
      })
    }

    // Initialize Supabase client with service role key for database updates
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('💳 Processing checkout.session.completed:', session.id)
        
        const bookingId = session.metadata?.booking_id
        if (!bookingId) {
          console.error('❌ Missing booking_id in session metadata')
          break
        }

        console.log('📋 Updating booking:', bookingId, 'to paid status')

        // Update booking status to paid with comprehensive fields
        const { error: updateError } = await supabaseClient
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'paid',
            payment_confirmation_status: 'all_set',
            total_paid_cents: session.amount_total,
            stripe_payment_intent_id: session.payment_intent as string || session.id,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        if (updateError) {
          console.error('❌ Error updating booking after payment:', updateError)
        } else {
          console.log('✅ Booking updated to paid:', bookingId)
          
          // Verify the update worked
          const { data: verifyBooking, error: verifyError } = await supabaseClient
            .from('bookings')
            .select('id, payment_status, status, paid_at')
            .eq('id', bookingId)
            .single()
          
          if (verifyError) {
            console.error('❌ Error verifying booking update:', verifyError)
          } else {
            console.log('✅ Booking verification:', verifyBooking)
          }
          
          // Trigger email notifications
          try {
            await supabaseClient.functions.invoke('send-booking-confirmation-emails', {
              body: { booking_id: bookingId }
            })
            console.log('✅ Email notifications triggered')
          } catch (emailError) {
            console.error('⚠️ Error triggering emails:', emailError)
          }
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('💰 Processing payment_intent.succeeded:', paymentIntent.id)
        
        // Find booking by stripe_payment_intent_id
        const { data: booking, error: fetchError } = await supabaseClient
          .from('bookings')
          .select('id, payment_status')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (fetchError || !booking) {
          console.error('❌ Could not find booking for payment_intent:', paymentIntent.id)
          break
        }

        // Only update if not already paid (avoid duplicate updates)
        if (booking.payment_status !== 'paid') {
          console.log('📋 Updating booking via payment_intent:', booking.id)
          
          const { error: updateError } = await supabaseClient
            .from('bookings')
            .update({
              payment_status: 'paid',
              status: 'paid',
              payment_confirmation_status: 'all_set',
              total_paid_cents: paymentIntent.amount,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id)

          if (updateError) {
            console.error('❌ Error updating booking after payment_intent:', updateError)
          } else {
            console.log('✅ Booking confirmed paid via payment_intent:', booking.id)
          }
        } else {
          console.log('ℹ️ Booking already marked as paid:', booking.id)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Processing payment_intent.payment_failed:', paymentIntent.id)
        
        // Find booking by stripe_payment_intent_id
        const { data: booking, error: fetchError } = await supabaseClient
          .from('bookings')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (fetchError || !booking) {
          console.error('❌ Could not find booking for failed payment:', paymentIntent.id)
          break
        }

        // Update booking status to failed
        const { error: updateError } = await supabaseClient
          .from('bookings')
          .update({
            payment_status: 'failed',
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)

        if (updateError) {
          console.error('❌ Error updating booking after payment failure:', updateError)
        } else {
          console.log('✅ Booking marked as payment failed:', booking.id)
        }
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
