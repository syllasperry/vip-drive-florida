
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, User, Car, DollarSign, MessageCircle, CreditCard, AlertCircle, Phone } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMyBookings } from '@/hooks/useMyBookings';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const PassengerBookingsList = () => {
  const { bookings, loading, error, refetch } = useMyBookings();
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; booking: any }>({
    isOpen: false,
    booking: null
  });
  const { toast } = useToast();

  const getStatusVariant = (booking: any) => {
    const status = booking.status?.toLowerCase();
    const paymentStatus = booking.payment_confirmation_status?.toLowerCase();
    const rideStatus = booking.ride_status?.toLowerCase();

    // Handle SmartPrice ON/OFF logic - passenger only sees final price
    if (paymentStatus === 'all_set') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (rideStatus === 'offer_sent' || status === 'offer_sent') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (paymentStatus === 'waiting_for_payment' || paymentStatus === 'passenger_paid') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    if (status === 'pending' || paymentStatus === 'waiting_for_offer') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (status === 'cancelled') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (booking: any) => {
    const status = booking.status?.toLowerCase();
    const paymentStatus = booking.payment_confirmation_status?.toLowerCase();
    const rideStatus = booking.ride_status?.toLowerCase();

    // Simplified booking states as per dispatcher changes
    if (paymentStatus === 'all_set') {
      return 'All Set';
    }
    if (rideStatus === 'offer_sent' || status === 'offer_sent') {
      return 'Offer Sent - Review Payment';
    }
    if (paymentStatus === 'waiting_for_payment') {
      return 'Awaiting Payment';
    }
    if (paymentStatus === 'passenger_paid') {
      return 'Payment Confirmed';
    }
    if (status === 'pending' || paymentStatus === 'waiting_for_offer') {
      return 'Request Received';
    }
    if (status === 'cancelled') {
      return 'Cancelled';
    }
    
    return status ? status.replace('_', ' ').toUpperCase() : 'Unknown';
  };

  const getDriverDisplay = (booking: any) => {
    // Show driver info only after "All Set" status (when dispatcher assigns)
    if (!booking.driver_id || !booking.driver_name) {
      return 'Driver to be assigned';
    }
    return booking.driver_name;
  };

  const canMessageDriver = (booking: any) => {
    // Can message driver only when All Set (driver assigned and payment confirmed)
    return booking.driver_id && booking.driver_name && booking.payment_confirmation_status === 'all_set';
  };

  const shouldShowPaymentButton = (booking: any) => {
    // Show payment button when offer is sent
    return booking.ride_status === 'offer_sent' || booking.status === 'offer_sent';
  };

  const handlePaymentClick = (booking: any) => {
    // Redirect to payment or show payment modal
    toast({
      title: "Payment Required",
      description: "Redirecting to payment options...",
    });
    // This would integrate with actual payment flow
  };

  const handleMessageDriver = (booking: any) => {
    toast({
      title: "Messaging",
      description: "Opening conversation with your driver...",
    });
    // This would open messaging interface
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={refetch} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-500">Your ride bookings will appear here once you make your first booking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-full p-2">
                  <Car className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Booking #{booking.booking_code || booking.id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created {format(parseISO(booking.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <Badge className={`px-2 py-1 text-xs border ${getStatusVariant(booking)}`}>
                {getStatusLabel(booking)}
              </Badge>
            </div>

            {/* Trip Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    From: {booking.pickup_location}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    To: {booking.dropoff_location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(parseISO(booking.pickup_time), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(parseISO(booking.pickup_time), 'HH:mm')}</span>
                </div>
                {booking.vehicle_type && (
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    <span>{booking.vehicle_type}</span>
                  </div>
                )}
              </div>

              {/* Driver Info */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Driver: {getDriverDisplay(booking)}
                </span>
                {booking.driver_phone && booking.payment_confirmation_status === 'all_set' && (
                  <Phone className="h-3 w-3 text-gray-400 ml-2" />
                )}
              </div>

              {/* Price Info - Only final price shown to passenger */}
              {(booking.estimated_price || booking.final_price) && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    ${booking.final_price || booking.estimated_price}
                  </span>
                  {booking.distance_miles && (
                    <span className="text-sm text-gray-500">
                      ({booking.distance_miles} miles)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              {shouldShowPaymentButton(booking) && (
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => handlePaymentClick(booking)}
                >
                  <CreditCard className="h-3 w-3" />
                  Review & Pay
                </Button>
              )}
              {canMessageDriver(booking) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => handleMessageDriver(booking)}
                >
                  <MessageCircle className="h-3 w-3" />
                  Message Driver
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
