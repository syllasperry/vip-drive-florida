
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CheckoutTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testBookingId, setTestBookingId] = useState<string>('');

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
      const { data: passenger, error: passengerError } = await supabase
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
      }

      const passengerId = passenger?.id || newPassenger?.id;

      // Create a test booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          passenger_id: passengerId,
          pickup_location: 'Test Pickup Location',
          dropoff_location: 'Test Dropoff Location',
          pickup_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          passenger_count: 1,
          vehicle_type: 'Tesla Model Y',
          offer_price_cents: 5000, // $50.00
          booking_code: `TEST-${Date.now()}`,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      setTestBookingId(booking.id);
      toast({
        title: "Test Booking Created",
        description: `Booking ID: ${booking.id}`,
      });

      return booking.id;
    } catch (error) {
      console.error('Error creating test booking:', error);
      toast({
        title: "Error",
        description: "Failed to create test booking",
        variant: "destructive",
      });
      return null;
    }
  };

  const testCheckout = async () => {
    setIsLoading(true);
    
    try {
      // Create test booking if not exists
      let bookingId = testBookingId;
      if (!bookingId) {
        bookingId = await createTestBooking();
        if (!bookingId) return;
      }

      console.log('🚀 Testing checkout with booking ID:', bookingId);

      // Call stripe-start-checkout function
      const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
        body: { booking_id: bookingId }
      });

      if (error) {
        console.error('❌ Checkout error:', error);
        toast({
          title: "Checkout Error",
          description: error.message || "Failed to create checkout session",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Checkout response:', data);

      if (data.url) {
        toast({
          title: "Checkout Session Created",
          description: "Redirecting to Stripe Checkout...",
        });
        
        // Open Stripe checkout
        window.open(data.url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "No checkout URL received",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkBookingStatus = async () => {
    if (!testBookingId) {
      toast({
        title: "No Booking",
        description: "Create a test booking first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', testBookingId)
        .single();

      if (error) throw error;

      console.log('📋 Current booking status:', booking);

      toast({
        title: "Booking Status",
        description: `Status: ${booking.status}, Payment Status: ${booking.payment_status}`,
      });

    } catch (error) {
      console.error('Error checking booking status:', error);
      toast({
        title: "Error",
        description: "Failed to check booking status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Stripe Checkout Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testBookingId && (
          <div className="text-sm text-gray-600">
            <p>Test Booking ID:</p>
            <p className="font-mono text-xs break-all">{testBookingId}</p>
          </div>
        )}
        
        <div className="space-y-2">
          <Button 
            onClick={testCheckout} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Checkout...' : 'Test Stripe Checkout'}
          </Button>
          
          <Button 
            onClick={checkBookingStatus} 
            variant="outline"
            className="w-full"
            disabled={!testBookingId}
          >
            Check Booking Status
          </Button>
          
          <Button 
            onClick={createTestBooking}
            variant="secondary"
            className="w-full"
          >
            Create New Test Booking
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>This will test the complete flow:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Create test booking with passenger</li>
            <li>Generate Stripe checkout session</li>
            <li>Process webhook events</li>
            <li>Update booking status</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutTest;
