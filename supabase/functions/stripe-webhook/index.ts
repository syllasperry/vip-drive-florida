
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
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret')
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log(`🔔 Stripe webhook received: ${event.type}`)

    // Initialize Supabase with service role key for database updates
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.booking_id

        if (!bookingId) {
          console.error('No booking_id in session metadata')
          return new Response('Missing booking ID', { status: 400 })
        }

        console.log(`✅ Payment completed for booking ${bookingId}`)

        // Get the offer price from metadata
        const offerPriceCents = parseInt(session.metadata?.offer_price_cents || '0')

        // Update booking to paid status
        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'paid',
            payment_status: 'paid',
            payment_confirmation_status: 'all_set',
            paid_at: new Date().toISOString(),
            total_paid_cents: offerPriceCents,
            stripe_payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)
          .select(`
            *,
            passengers (
              id,
              full_name,
              email,
              phone
            ),
            drivers (
              id,
              full_name,
              email,
              phone
            )
          `)
          .single()

        if (updateError) {
          console.error('Error updating booking:', updateError)
          return new Response('Database update failed', { status: 500 })
        }

        // Trigger confirmation emails
        try {
          await supabase.functions.invoke('send-booking-confirmation-emails', {
            body: { booking_id: bookingId }
          })
          console.log('✅ Confirmation emails triggered')
        } catch (emailError) {
          console.error('Error triggering confirmation emails:', emailError)
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find booking by payment intent ID
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id, offer_price_cents')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (findError || !booking) {
          console.log('No booking found for payment intent:', paymentIntent.id)
          break
        }

        console.log(`✅ Payment intent succeeded for booking ${booking.id}`)

        // Ensure booking is marked as paid
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'paid',
            payment_status: 'paid',
            payment_confirmation_status: 'all_set',
            paid_at: new Date().toISOString(),
            total_paid_cents: booking.offer_price_cents,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)

        if (updateError) {
          console.error('Error updating booking on payment_intent.succeeded:', updateError)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find booking by payment intent ID
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (findError || !booking) {
          console.log('No booking found for failed payment intent:', paymentIntent.id)
          break
        }

        console.log(`❌ Payment failed for booking ${booking.id}`)

        // Update booking to payment failed status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'payment_failed',
            payment_status: 'failed',
            payment_confirmation_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)

        if (updateError) {
          console.error('Error updating booking on payment failure:', updateError)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
