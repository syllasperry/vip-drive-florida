
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMyBookings } from '@/hooks/useMyBookings';
import { useToast } from '@/hooks/use-toast';
import PassengerBookingCard from './PassengerBookingCard';

const PassengerBookingsList: React.FC = () => {
  const { bookings, isLoading, error, refetch } = useMyBookings();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const paid = searchParams.get('paid');
    const canceled = searchParams.get('canceled');
    const bookingId = searchParams.get('booking_id');

    if (paid === 'true' && bookingId) {
      console.log('🎉 Payment success detected for booking:', bookingId);
      toast({
        title: "Payment Successful",
        description: "Your ride has been confirmed and paid for successfully!",
      });
      // Force refetch to get latest booking status
      refetch();
      
      // Clean up URL params after showing toast
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('paid');
      newUrl.searchParams.delete('booking_id');
      newUrl.searchParams.delete('session_id');
      window.history.replaceState({}, '', newUrl.toString());
    }

    if (canceled === 'true') {
      console.log('❌ Payment canceled detected');
      toast({
        title: "Payment Canceled",
        description: "You can complete the payment later to confirm your ride.",
        variant: "destructive",
      });
      
      // Clean up URL params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('canceled');
      newUrl.searchParams.delete('booking_id');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, toast, refetch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('❌ Error loading bookings:', error);
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading bookings. Please try refreshing the page.</p>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No bookings found. Book your first ride!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <PassengerBookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
};

export default PassengerBookingsList;
