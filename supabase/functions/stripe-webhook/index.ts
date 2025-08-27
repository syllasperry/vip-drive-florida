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

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Idempotency check
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

    // Log the webhook event FIRST
    await supabaseClient
      .from('payment_webhook_events')
      .insert({
        provider: 'stripe',
        provider_event_id: event.id,
        event_type: event.type,
        payload: event,
        processed_ok: false
      })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('💳 Processing checkout.session.completed:', session.id)
        
        // Enhanced logging for debugging
        console.log('🏷️ Session metadata:', session.metadata)
        console.log('🔍 Client reference ID:', session.client_reference_id)
        
        // CRITICAL FIX: Try multiple ways to get booking identifier
        let bookingCode = session.client_reference_id || session.metadata?.booking_code
        let bookingId = session.metadata?.booking_id
        
        console.log('📄 Initial booking identifiers:', { bookingCode, bookingId })
        
        // If no booking_code, try to get from booking_id
        if (!bookingCode && bookingId) {
          console.log('🔄 Trying to get booking_code from booking_id:', bookingId)
          const { data: booking } = await supabaseClient
            .from('bookings')
            .select('booking_code')
            .eq('id', bookingId)
            .single()
          
          if (booking?.booking_code) {
            bookingCode = booking.booking_code
            console.log('✅ Found booking_code from DB:', bookingCode)
          }
        }

        // CRITICAL: Process payment regardless of whether we have booking_code or booking_id
        if (bookingCode || bookingId) {
          try {
            const updateData = {
              status: 'paid',
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              paid_amount_cents: session.amount_total || 0,
              paid_currency: (session.currency || 'usd').toLowerCase(),
              payment_provider: 'stripe',
              payment_reference: session.payment_intent as string || session.id,
              payment_confirmation_status: 'all_set',
              updated_at: new Date().toISOString()
            }

            let updatedBooking = null
            
            // Try updating by booking_code first
            if (bookingCode) {
              console.log('🔄 Updating booking by code:', bookingCode)
              const { data, error } = await supabaseClient
                .from('bookings')
                .update(updateData)
                .eq('booking_code', bookingCode)
                .select()
                .single()

              if (error) {
                console.error('❌ Error updating booking by code:', error)
              } else {
                updatedBooking = data
                console.log('✅ Payment recorded successfully for booking code:', bookingCode)
              }
            }
            
            // If booking_code update failed, try booking_id
            if (!updatedBooking && bookingId) {
              console.log('🔄 Fallback: updating booking by ID:', bookingId)
              const { data, error } = await supabaseClient
                .from('bookings')
                .update(updateData)
                .eq('id', bookingId)
                .select()
                .single()

              if (error) {
                console.error('❌ Error updating booking by ID:', error)
              } else {
                updatedBooking = data
                console.log('✅ Payment recorded successfully for booking ID:', bookingId)
              }
            }

            if (updatedBooking) {
              // Also insert into payments table for record keeping
              const { error: paymentInsertError } = await supabaseClient
                .from('payments')
                .insert({
                  booking_id: updatedBooking.id,
                  amount_cents: session.amount_total || 0,
                  currency: (session.currency || 'usd').toUpperCase(),
                  method: 'stripe',
                  provider_txn_id: session.payment_intent as string || session.id,
                  status: 'PAID',
                  meta: {
                    stripe_session_id: session.id,
                    booking_code: bookingCode || 'unknown',
                    booking_id: bookingId || updatedBooking.id,
                    processed_at: new Date().toISOString()
                  }
                })

              if (paymentInsertError) {
                console.error('⚠️ Error inserting payment record:', paymentInsertError)
              } else {
                console.log('✅ Payment record inserted successfully')
              }

              // Mark webhook event as processed
              await supabaseClient
                .from('payment_webhook_events')
                .update({ processed_ok: true })
                .eq('provider_event_id', event.id)

              // Try to trigger email notifications
              try {
                await supabaseClient.functions.invoke('send-booking-confirmation-emails', {
                  body: { booking_id: updatedBooking.id }
                })
                console.log('✅ Email notifications triggered')
              } catch (emailError) {
                console.error('⚠️ Error triggering emails:', emailError)
              }
            } else {
              console.error('❌ Failed to update booking with either method')
            }

          } catch (error) {
            console.error('❌ Error processing payment:', error)
          }
        } else {
          console.error('❌ No booking identifier found in session metadata')
          console.log('🔍 Full session object:', JSON.stringify(session, null, 2))
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('💰 Processing payment_intent.succeeded:', paymentIntent.id)
        
        // This is a backup handler in case checkout.session.completed fails
        // We'll only process if no successful checkout.session.completed was already processed
        
        // Find related checkout session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1
        })

        if (sessions.data.length > 0) {
          const relatedSession = sessions.data[0]
          let bookingCode = relatedSession.client_reference_id || relatedSession.metadata?.booking_code
          
          if (!bookingCode && relatedSession.metadata?.booking_id) {
            const { data: booking } = await supabaseClient
              .from('bookings')
              .select('booking_code')
              .eq('id', relatedSession.metadata.booking_id)
              .single()
            
            if (booking?.booking_code) {
              bookingCode = booking.booking_code
            }
          }
          
          console.log('🔍 Found related session with booking_code:', bookingCode)
          
          if (bookingCode) {
            // Check if booking is already marked as paid
            const { data: existingBooking } = await supabaseClient
              .from('bookings')
              .select('payment_status, paid_at')
              .eq('booking_code', bookingCode)
              .single()

            if (existingBooking?.payment_status === 'paid' && existingBooking?.paid_at) {
              console.log('ℹ️ Booking already marked as paid, skipping payment_intent processing')
            } else {
              // Process payment as backup
              const { error: updateError } = await supabaseClient
                .from('bookings')
                .update({
                  status: 'paid',
                  payment_status: 'paid',
                  paid_at: new Date().toISOString(),
                  paid_amount_cents: paymentIntent.amount,
                  paid_currency: (paymentIntent.currency || 'usd').toLowerCase(),
                  payment_provider: 'stripe',
                  payment_reference: paymentIntent.id,
                  payment_confirmation_status: 'all_set',
                  updated_at: new Date().toISOString()
                })
                .eq('booking_code', bookingCode)

              if (updateError) {
                console.error('❌ Error updating booking via payment_intent:', updateError)
              } else {
                console.log('✅ Payment confirmed via payment_intent:', bookingCode)
                
                // Mark webhook event as processed
                await supabaseClient
                  .from('payment_webhook_events')
                  .update({ processed_ok: true })
                  .eq('provider_event_id', event.id)
              }
            }
          } else if (relatedSession.metadata?.booking_id) {
            // Try updating by booking ID as fallback
            const bookingId = relatedSession.metadata.booking_id
            console.log('🔄 Backup: updating booking by ID:', bookingId)
            
            const { error: updateError } = await supabaseClient
              .from('bookings')
              .update({
                status: 'paid',
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
                paid_amount_cents: paymentIntent.amount,
                paid_currency: (paymentIntent.currency || 'usd').toLowerCase(),
                payment_provider: 'stripe',
                payment_reference: paymentIntent.id,
                payment_confirmation_status: 'all_set',
                updated_at: new Date().toISOString()
              })
              .eq('id', bookingId)

            if (updateError) {
              console.error('❌ Error updating booking by ID via payment_intent:', updateError)
            } else {
              console.log('✅ Payment confirmed via payment_intent (by ID):', bookingId)
              
              // Mark webhook event as processed
              await supabaseClient
                .from('payment_webhook_events')
                .update({ processed_ok: true })
                .eq('provider_event_id', event.id)
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
          let bookingCode = relatedSession.client_reference_id || relatedSession.metadata?.booking_code
          
          if (!bookingCode && relatedSession.metadata?.booking_id) {
            const { data: booking } = await supabaseClient
              .from('bookings')
              .select('booking_code')
              .eq('id', relatedSession.metadata.booking_id)
              .single()
            
            if (booking?.booking_code) {
              bookingCode = booking.booking_code
            }
          }
          
          if (bookingCode) {
            const { error: updateError } = await supabaseClient
              .from('bookings')
              .update({
                payment_status: 'failed',
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('booking_code', bookingCode)

            if (updateError) {
              console.error('❌ Error updating booking after payment failure:', updateError)
            } else {
              console.log('✅ Booking marked as payment failed:', bookingCode)
            }
          } else if (relatedSession.metadata?.booking_id) {
            // Try updating by booking ID as fallback
            const bookingId = relatedSession.metadata.booking_id
            
            const { error: updateError } = await supabaseClient
              .from('bookings')
              .update({
                payment_status: 'failed',
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', bookingId)

            if (updateError) {
              console.error('❌ Error updating booking by ID after payment failure:', updateError)
            } else {
              console.log('✅ Booking marked as payment failed (by ID):', bookingId)
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
