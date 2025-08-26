
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { booking_code, amount_cents, currency = 'usd' } = req.body;

    if (!booking_code || !amount_cents) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate booking exists and get actual price to prevent tampering
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('booking_code, offer_price_cents, final_price_cents, passenger_id')
      .eq('booking_code', booking_code)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Use offer_price_cents, fallback to final_price_cents
    const validatedAmount = booking.offer_price_cents || booking.final_price_cents;
    
    if (!validatedAmount || validatedAmount !== amount_cents) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create Stripe session using edge function
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        booking_id: booking.passenger_id, // We'll need to map this properly
        booking_code: booking_code,
        amount_cents: validatedAmount,
        currency: currency,
        breakdown: {
          base: validatedAmount,
          total: validatedAmount
        }
      }
    });

    if (sessionError) {
      console.error('Stripe session creation failed:', sessionError);
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }

    return res.status(200).json({ url: sessionData.url });

  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
