
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, User, Car, DollarSign, MessageCircle, CreditCard, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMyBookings } from '@/hooks/useMyBookings';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const PassengerBookingsList = () => {
  const { bookings, loading, error, refetch } = useMyBookings();
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; booking: any }>({
    isOpen: false,
    booking: null
  });
  const { toast } = useToast();

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offer_sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
      case 'confirmed':
      case 'all_set':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'payment_pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Request Received';
      case 'offer_sent': return 'Offer Sent';
      case 'accepted': return 'Accepted';
      case 'confirmed': return 'Confirmed';
      case 'all_set': return 'All Set';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'payment_pending': return 'Awaiting Payment';
      default: return status || 'Unknown';
    }
  };

  const getDriverDisplay = (booking: any) => {
    if (!booking.driver_id || !booking.driver_name) {
      return 'Driver to be assigned';
    }
    return booking.driver_name;
  };

  const canMessageDriver = (booking: any) => {
    return booking.driver_id && booking.driver_name && ['offer_sent', 'all_set', 'in_progress'].includes(booking.status?.toLowerCase());
  };

  const handlePaymentClick = (booking: any) => {
    setPaymentModal({ isOpen: true, booking });
  };

  const handlePaymentConfirmed = () => {
    toast({
      title: "Payment Initiated",
      description: "Redirecting to payment processor...",
    });
    setPaymentModal({ isOpen: false, booking: null });
    refetch();
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
    <>
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
                <Badge className={`px-2 py-1 text-xs border ${getStatusVariant(booking.status)}`}>
                  {getStatusLabel(booking.status)}
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
                </div>

                {/* Price Info */}
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
                {canMessageDriver(booking) && (
                  <Button variant="outline" size="sm" className="gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Message Driver
                  </Button>
                )}
                {booking.status === 'offer_sent' && (
                  <Button 
                    size="sm" 
                    className="gap-1"
                    onClick={() => handlePaymentClick(booking)}
                  >
                    <CreditCard className="h-3 w-3" />
                    Review Offer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, booking: null })}
        booking={paymentModal.booking}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </>
  );
};
