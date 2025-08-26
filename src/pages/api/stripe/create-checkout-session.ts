
import { supabase } from '@/integrations/supabase/client';
import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { booking_code, currency = 'usd' } = req.body;

    if (!booking_code) {
      return res.status(400).json({ error: 'Missing booking_code' });
    }

    console.log('🔄 Creating checkout session for booking:', booking_code);

    // Get booking with offer_price_cents server-side (never trust client)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('booking_code, offer_price_cents, passenger_id, id')
      .eq('booking_code', booking_code)
      .single();

    if (bookingError || !booking) {
      console.error('❌ Booking not found:', bookingError);
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.offer_price_cents || booking.offer_price_cents <= 0) {
      console.error('❌ Invalid offer price:', booking.offer_price_cents);
      return res.status(400).json({ error: 'Invalid offer price' });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    console.log('💳 Creating Stripe session with amount:', booking.offer_price_cents);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: `Booking ${booking_code}`,
            description: `VIP Transport Service - ${booking_code}`,
          },
          unit_amount: booking.offer_price_cents,
        },
        quantity: 1,
      }],
      metadata: {
        booking_code: booking_code,
        booking_id: booking.id,
      },
      success_url: `${req.headers.origin || 'http://localhost:8080'}/passenger/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:8080'}/passenger/dashboard`,
    });

    console.log('✅ Stripe session created:', session.id);

    return res.status(200).json({ 
      url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('❌ Checkout session creation error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
