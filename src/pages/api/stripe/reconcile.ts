
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Use service role key for reconcile operations
const supabaseService = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id' });
    }

    console.log('🔄 Reconciling session:', session_id);

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id as string);
    
    if (session.payment_status !== 'paid') {
      console.log('💳 Session not paid yet:', session.payment_status);
      return res.status(200).json({ paid: false });
    }

    const booking_code = session.metadata?.booking_code;
    
    if (!booking_code) {
      console.error('❌ No booking_code in session metadata');
      return res.status(400).json({ error: 'No booking_code in metadata' });
    }

    // Check if booking is already marked as paid
    const { data: booking, error: fetchError } = await supabaseService
      .from('bookings')
      .select('status, payment_status, paid_at')
      .eq('booking_code', booking_code)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching booking:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch booking' });
    }

    // If already paid, return success
    if (booking.status === 'paid' || booking.payment_status === 'paid' || booking.paid_at) {
      console.log('✅ Booking already marked as paid');
      return res.status(200).json({ paid: true });
    }

    // Payment succeeded but booking not marked as paid - update it
    console.log('🔧 Updating booking to paid status via reconcile');

    const amount_cents = session.amount_total || 0;
    const currency = (session.currency || 'usd').toLowerCase();
    const provider_reference = session.payment_intent as string;

    try {
      // Try RPC first
      const { data: rpcResult, error: rpcError } = await supabaseService
        .rpc('record_stripe_payment', {
          _booking_code: booking_code,
          _amount_cents: amount_cents,
          _provider_reference: provider_reference,
          _currency: currency
        });

      if (rpcError) {
        console.error('❌ RPC Error in reconcile:', rpcError);
        
        // Fallback: Direct update
        const { error: updateError } = await supabaseService
          .from('bookings')
          .update({
            status: 'paid',
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            paid_amount_cents: amount_cents,
            paid_currency: currency,
            payment_provider: 'stripe',
            payment_reference: provider_reference,
            updated_at: new Date().toISOString()
          })
          .eq('booking_code', booking_code);

        if (updateError) {
          console.error('❌ Direct update failed in reconcile:', updateError);
          throw updateError;
        } else {
          console.log('✅ Reconcile update successful (direct)');
        }
      } else {
        console.log('✅ Reconcile update successful (RPC):', rpcResult);
      }

      return res.status(200).json({ paid: true });

    } catch (error) {
      console.error('❌ Error in reconcile update:', error);
      return res.status(500).json({ error: 'Failed to update booking' });
    }

  } catch (error: any) {
    console.error('❌ Reconcile error:', error);
    return res.status(500).json({ error: 'Reconcile failed' });
  }
}
