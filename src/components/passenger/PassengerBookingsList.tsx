
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, RefreshCw } from 'lucide-react';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { OfferBookingCard } from './OfferBookingCard';
import { EnhancedBookingCard } from './EnhancedBookingCard';
import { useNavigate } from 'react-router-dom';

interface PassengerBookingsListProps {
  showHeader?: boolean;
}

export default function PassengerBookingsList({ showHeader = true }: PassengerBookingsListProps) {
  const navigate = useNavigate();
  const { bookings, loading, error, refetch } = useRealtimeBookings();

  // Create passenger info from first booking if available
  const passengerInfo = bookings.length > 0 && bookings[0].passengers 
    ? {
        id: bookings[0].passengers.id,
        full_name: bookings[0].passengers.full_name,
        profile_photo_url: bookings[0].passengers.profile_photo_url,
        phone: bookings[0].passengers.phone,
        email: bookings[0].passengers.email || ''
      }
    : null;

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <p className="font-semibold">Error Loading Bookings</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={refetch} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Check if booking has received an offer or is in payment/confirmation flow
  const isOfferOrPaymentBooking = (booking: any) => {
    return booking.status === 'offer_sent' || 
           booking.ride_status === 'offer_sent' ||
           booking.payment_confirmation_status === 'price_awaiting_acceptance' ||
           booking.payment_status === 'paid' ||
           booking.payment_confirmation_status === 'passenger_paid' ||
           booking.payment_confirmation_status === 'all_set';
  };

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Bookings</h2>
            <p className="text-sm text-gray-500">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/passenger/price-estimate')}
            className="bg-[#FF385C] hover:bg-[#E31C5F] text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first booking to get started
              </p>
              <Button 
                onClick={() => navigate('/passenger/price-estimate')}
                className="bg-[#FF385C] hover:bg-[#E31C5F] text-white"
              >
                Book Your First Ride
              </Button>
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => {
            // Use enhanced offer card for bookings with offers/payments
            if (isOfferOrPaymentBooking(booking) && passengerInfo) {
              return (
                <OfferBookingCard
                  key={booking.id}
                  booking={booking}
                  passengerInfo={passengerInfo}
                  onViewDetails={() => console.log('View details for:', booking.id)}
                />
              );
            }
            
            // Use regular card for other bookings
            return passengerInfo ? (
              <EnhancedBookingCard
                key={booking.id}
                booking={booking}
                passengerInfo={passengerInfo}
                onViewDetails={() => console.log('View details for:', booking.id)}
              />
            ) : null;
          }).filter(Boolean)
        )}
      </div>
    </div>
  );
}
