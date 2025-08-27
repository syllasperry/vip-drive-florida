
import { createClient } from '@supabase/supabase-js';

// Use service role key for webhook operations
const supabaseService = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 WEBHOOK RECEIVED');
    
    const body = req.body;
    const eventType = body?.type || 'unknown';

    console.log('✅ Webhook event type:', eventType);

    // Handle checkout session completed
    if (eventType === 'checkout.session.completed') {
      const session = body.data?.object;
      console.log('💳 Processing checkout.session.completed:', session?.id);
      
      const booking_code = session?.metadata?.booking_code;
      console.log('📄 Booking code from metadata:', booking_code);
      
      if (!booking_code) {
        console.error('❌ No booking_code in session metadata');
        return res.status(400).json({ error: 'No booking_code in metadata' });
      }

      const amount_cents = session?.amount_total || 0;
      const currency = (session?.currency || 'usd').toLowerCase();
      const provider_reference = session?.payment_intent || session?.id;

      console.log('💰 Payment details:', {
        booking_code,
        amount_cents,
        currency,
        provider_reference
      });

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
          console.error('❌ RPC Error calling record_stripe_payment:', rpcError);
          
          // Fallback: Direct database update
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
            console.error('❌ Direct update failed:', updateError);
            throw updateError;
          } else {
            console.log('✅ Direct booking update successful (fallback)');
          }
        } else {
          console.log('✅ RPC record_stripe_payment successful:', rpcResult);
        }

      } catch (error) {
        console.error('❌ Error processing payment:', error);
        throw error;
      }
    }

    return res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
