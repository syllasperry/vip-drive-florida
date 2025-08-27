
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const CheckoutTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const createTestBooking = async () => {
    try {
      // Get or create passenger profile first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a test booking",
          variant: "destructive",
        });
        return null;
      }

      // Get passenger profile
      let { data: passenger, error: passengerError } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (passengerError || !passenger) {
        // Create passenger profile if it doesn't exist
        const { data: newPassenger, error: createError } = await supabase
          .from('passengers')
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email || 'Test User',
            email: user.email || 'test@example.com'
          })
          .select()
          .single();

        if (createError || !newPassenger) {
          toast({
            title: "Error",
            description: "Failed to create passenger profile",
            variant: "destructive",
          });
          return null;
        }
        passenger = newPassenger;
      }

      const passengerId = passenger.id;

      // Create a test booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          passenger_id: passengerId,
          pickup_location: 'Test Pickup Location - 2100 NW 42nd Ave',
          dropoff_location: 'Test Dropoff Location - 903 NW 35th St',
          pickup_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          passenger_count: 1,
          luggage_count: 1,
          vehicle_type: 'Tesla Model Y',
          offer_price_cents: 10000, // $100.00
          status: 'offer_sent'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        toast({
          title: "Error",
          description: `Failed to create booking: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Test booking created:', booking);
      return booking;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Unexpected error creating booking",
        variant: "destructive",
      });
      return null;
    }
  };

  const testStripeCheckout = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Step 1: Create test booking
      console.log('🔄 Step 1: Creating test booking...');
      const booking = await createTestBooking();
      if (!booking) {
        setIsLoading(false);
        return;
      }

      toast({
        title: "Booking Created",
        description: `Test booking ${booking.booking_code || booking.id.slice(-8)} created successfully`,
      });

      // Step 2: Create Stripe checkout session
      console.log('🔄 Step 2: Creating Stripe checkout session...');
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('stripe-start-checkout', {
        body: { booking_id: booking.id }
      });

      if (checkoutError) {
        console.error('❌ Stripe checkout error:', checkoutError);
        toast({
          title: "Checkout Error",
          description: checkoutError.message || "Failed to create checkout session",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ Checkout session created:', checkoutData);
      
      // Step 3: Open Stripe checkout
      if (checkoutData.url) {
        console.log('🔄 Step 3: Opening Stripe checkout...');
        toast({
          title: "Opening Stripe Checkout",
          description: "Redirecting to Stripe payment page...",
        });
        
        // Open in new tab for testing
        window.open(checkoutData.url, '_blank');
        
        setTestResult({
          booking,
          checkoutSession: checkoutData,
          success: true,
          message: 'Checkout session created successfully. Complete payment in the new tab.'
        });
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkBookingStatus = async () => {
    if (!testResult?.booking?.id) {
      toast({
        title: "No Booking",
        description: "Create a test booking first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', testResult.booking.id)
        .single();

      if (error) {
        console.error('Error checking booking:', error);
        toast({
          title: "Error",
          description: "Failed to check booking status",
          variant: "destructive",
        });
        return;
      }

      console.log('📊 Current booking status:', {
        id: updatedBooking.id,
        booking_code: updatedBooking.booking_code,
        status: updatedBooking.status,
        payment_status: updatedBooking.payment_status,
        paid_at: updatedBooking.paid_at,
        paid_amount_cents: updatedBooking.paid_amount_cents,
        offer_price_cents: updatedBooking.offer_price_cents,
        payment_provider: updatedBooking.payment_provider,
        payment_reference: updatedBooking.payment_reference
      });

      const isPaid = updatedBooking.status === 'paid' || 
                     updatedBooking.payment_status === 'paid' || 
                     updatedBooking.paid_at || 
                     updatedBooking.paid_amount_cents > 0;

      toast({
        title: "Booking Status Check",
        description: `Booking is ${isPaid ? 'PAID' : 'NOT PAID'} - Status: ${updatedBooking.status}`,
        variant: isPaid ? "default" : "destructive",
      });

      setTestResult(prev => ({
        ...prev,
        updatedBooking,
        isPaid
      }));

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "Unexpected error checking booking",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Stripe Payment Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="space-y-4">
            <Button 
              onClick={testStripeCheckout}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Creating Test...' : '🚀 Start Stripe Checkout Test'}
            </Button>

            {testResult?.booking && (
              <Button 
                onClick={checkBookingStatus}
                variant="outline"
                className="w-full"
              >
                🔍 Check Booking Payment Status
              </Button>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Booking ID:</strong> {testResult.booking?.id}</p>
                  <p><strong>Booking Code:</strong> {testResult.booking?.booking_code || 'N/A'}</p>
                  <p><strong>Amount:</strong> ${(testResult.booking?.offer_price_cents || 0) / 100}</p>
                  <p><strong>Status:</strong> {testResult.booking?.status}</p>
                  {testResult.checkoutSession?.url && (
                    <p><strong>Checkout URL:</strong> <span className="text-blue-600">Generated ✅</span></p>
                  )}
                  {testResult.updatedBooking && (
                    <div className="mt-4 p-3 bg-white border rounded">
                      <p className="font-medium">Latest Status:</p>
                      <p><strong>Payment Status:</strong> {testResult.updatedBooking.payment_status || 'N/A'}</p>
                      <p><strong>Paid At:</strong> {testResult.updatedBooking.paid_at || 'N/A'}</p>
                      <p><strong>Paid Amount:</strong> ${(testResult.updatedBooking.paid_amount_cents || 0) / 100}</p>
                      <p><strong>Payment Provider:</strong> {testResult.updatedBooking.payment_provider || 'N/A'}</p>
                      <p className={`font-bold ${testResult.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult.isPaid ? '✅ PAID' : '❌ NOT PAID'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>This will test the complete flow:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create test booking with passenger</li>
              <li>Generate Stripe checkout session</li>
              <li>Process webhook events</li>
              <li>Update booking status</li>
            </ul>
            <p className="mt-2 font-medium">Webhook Events Configured:</p>
            <ul className="list-disc list-inside">
              <li>checkout.session.completed</li>
              <li>payment_intent.succeeded</li>
              <li>payment_intent.payment_failed</li>
            </ul>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-medium text-yellow-800">Debugging Steps:</p>
            <ol className="list-decimal list-inside text-yellow-700 mt-1">
              <li>Create and pay for the test booking</li>
              <li>Check the Stripe webhook logs</li>
              <li>Check booking status updates</li>
              <li>Verify payment confirmation</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
