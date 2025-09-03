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
    console.log('🔍 Payment verification function called')
    
    const { booking_id } = await req.json()
    
    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'Missing booking_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📋 Verifying payment for booking:', booking_id)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError)
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📊 Current booking status:', {
      status: booking.status,
      payment_status: booking.payment_status,
      payment_confirmation_status: booking.payment_confirmation_status
    })

    // If already paid, return current status
    if (booking.payment_status === 'paid' && booking.payment_confirmation_status === 'all_set') {
      console.log('✅ Booking already marked as paid')
      return new Response(JSON.stringify({ 
        isPaid: true, 
        booking, 
        message: 'Already paid' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if we have Stripe data to verify
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured')
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Check for recent checkout sessions
    try {
      console.log('🔍 Searching for checkout sessions...')
      
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: {
          gte: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000) // Last 24 hours
        }
      })

      console.log('📄 Found', sessions.data.length, 'sessions in last 24 hours')

      // Find session matching this booking
      const matchingSession = sessions.data.find(session => 
        session.metadata?.booking_id === booking_id ||
        session.client_reference_id === booking_id
      )

      if (matchingSession) {
        console.log('🎯 Found matching session:', matchingSession.id)
        console.log('💳 Session status:', matchingSession.payment_status)
        
        if (matchingSession.payment_status === 'paid') {
          console.log('✅ Payment confirmed via Stripe session, updating booking...')
          
          // Update booking to paid status
          const updateData = {
            payment_status: 'paid',
            status: 'paid',
            payment_confirmation_status: 'all_set',
            paid_amount_cents: matchingSession.amount_total,
            paid_at: new Date().toISOString(),
            payment_provider: 'stripe',
            payment_reference: matchingSession.payment_intent as string || matchingSession.id,
            stripe_payment_intent_id: matchingSession.payment_intent as string || matchingSession.id,
            updated_at: new Date().toISOString()
          }
          
          const { data: updatedBooking, error: updateError } = await supabaseClient
            .from('bookings')
            .update(updateData)
            .eq('id', booking_id)
            .select()
            .single()

          if (updateError) {
            console.error('❌ Error updating booking:', updateError)
            return new Response(JSON.stringify({ error: 'Failed to update booking' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Create payment record
          try {
            await supabaseClient
              .from('payments')
              .insert({
                booking_id: booking_id,
                amount_cents: matchingSession.amount_total || 0,
                currency: 'USD',
                method: 'stripe',
                provider_txn_id: matchingSession.payment_intent as string || matchingSession.id,
                status: 'PAID',
                meta: {
                  stripe_session_id: matchingSession.id,
                  stripe_payment_intent_id: matchingSession.payment_intent,
                  verified_manually: true
                }
              })
          } catch (paymentError) {
            console.warn('⚠️ Could not create payment record:', paymentError)
          }

          // Send real-time notification
          try {
            await supabaseClient
              .from('realtime_outbox')
              .insert({
                topic: 'booking_payment_confirmed',
                booking_id: booking_id,
                payload: {
                  booking_id: booking_id,
                  status: 'paid',
                  payment_status: 'paid',
                  payment_confirmation_status: 'all_set',
                  payment_intent_id: matchingSession.payment_intent as string || matchingSession.id,
                  amount_cents: matchingSession.amount_total,
                  timestamp: new Date().toISOString(),
                  verified_manually: true
                }
              })
          } catch (notifError) {
            console.warn('⚠️ Could not send notification:', notifError)
          }

          console.log('✅ Booking updated successfully')
          
          return new Response(JSON.stringify({ 
            isPaid: true, 
            updated: true,
            booking: updatedBooking,
            message: 'Payment verified and booking updated'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } else {
        console.log('❌ No matching Stripe session found')
      }
    } catch (stripeError) {
      console.error('❌ Error checking Stripe:', stripeError)
    }

    return new Response(JSON.stringify({ 
      isPaid: false, 
      booking,
      message: 'No payment found'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in verify-payment-status:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})