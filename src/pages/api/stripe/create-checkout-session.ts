
import { supabase } from '@/integrations/supabase/client';

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

    // For now, return a mock success response
    // In production, this would create the actual Stripe session
    console.log('💳 Would create Stripe session with amount:', booking.offer_price_cents);

    // Mock Stripe checkout URL for testing
    const mockStripeUrl = `https://checkout.stripe.com/pay/mock?session_id=cs_test_${booking_code}&amount=${booking.offer_price_cents}`;

    return res.status(200).json({ 
      url: mockStripeUrl,
      session_id: `cs_test_${booking_code}`
    });

  } catch (error) {
    console.error('❌ Checkout session creation error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
