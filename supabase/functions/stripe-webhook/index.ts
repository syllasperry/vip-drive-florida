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

    // Verify webhook signature
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified:', event.type, 'Event ID:', event.id)
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

    // Idempotency check - prevent duplicate processing
    const { data: existingEvent } = await supabaseClient
      .from('payment_webhook_events')
      .select('id')
      .eq('provider_event_id', event.id)
      .single()

    if (existingEvent) {
      console.log('ℹ️ Event already processed:', event.id)
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Log the webhook event
    await supabaseClient
      .from('payment_webhook_events')
      .insert({
        provider: 'stripe',
        provider_event_id: event.id,
        event_type: event.type,
        payload: event,
        processed_ok: true
      })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('💳 Processing checkout.session.completed:', session.id)
        
        const bookingCode = session.metadata?.booking_code
        const bookingId = session.metadata?.booking_id
        
        if (!bookingCode && !bookingId) {
          console.error('❌ Missing booking_code and booking_id in session metadata')
          break
        }

        console.log('📋 Processing payment for booking_code:', bookingCode)

        try {
          // Call the record_stripe_payment function
          const { data: paymentResult, error: paymentError } = await supabaseClient
            .rpc('record_stripe_payment', {
              _booking_code: bookingCode,
              _amount_cents: session.amount_total || 0,
              _provider_reference: session.payment_intent as string || session.id,
              _currency: 'usd'
            })

          if (paymentError) {
            console.error('❌ Error calling record_stripe_payment:', paymentError)
            break
          }

          console.log('✅ Payment recorded successfully:', paymentResult)

          // Trigger email notifications if booking_id is available
          if (bookingId) {
            try {
              await supabaseClient.functions.invoke('send-booking-confirmation-emails', {
                body: { booking_id: bookingId }
              })
              console.log('✅ Email notifications triggered')
            } catch (emailError) {
              console.error('⚠️ Error triggering emails:', emailError)
            }
          }
        } catch (error) {
          console.error('❌ Error processing payment:', error)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('💰 Processing payment_intent.succeeded:', paymentIntent.id)
        
        // Find booking by metadata or related checkout session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1
        })

        if (sessions.data.length > 0) {
          const relatedSession = sessions.data[0]
          const bookingCode = relatedSession.metadata?.booking_code
          
          if (bookingCode) {
            try {
              const { data: paymentResult, error: paymentError } = await supabaseClient
                .rpc('record_stripe_payment', {
                  _booking_code: bookingCode,
                  _amount_cents: paymentIntent.amount,
                  _provider_reference: paymentIntent.id,
                  _currency: 'usd'
                })

              if (paymentError) {
                console.error('❌ Error calling record_stripe_payment via payment_intent:', paymentError)
              } else {
                console.log('✅ Payment confirmed via payment_intent:', paymentResult)
              }
            } catch (error) {
              console.error('❌ Error processing payment_intent:', error)
            }
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Processing payment_intent.payment_failed:', paymentIntent.id)
        
        // Find related booking and mark as failed
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1
        })

        if (sessions.data.length > 0) {
          const relatedSession = sessions.data[0]
          const bookingId = relatedSession.metadata?.booking_id
          
          if (bookingId) {
            const { error: updateError } = await supabaseClient
              .from('bookings')
              .update({
                payment_status: 'failed',
                status: 'cancelled',
                payment_confirmation_status: 'failed',
                updated_at: new Date().toISOString()
              })
              .eq('id', bookingId)

            if (updateError) {
              console.error('❌ Error updating booking after payment failure:', updateError)
            } else {
              console.log('✅ Booking marked as payment failed:', bookingId)
            }
          }
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
