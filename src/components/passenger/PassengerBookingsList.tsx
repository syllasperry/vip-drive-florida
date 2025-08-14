import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Calendar, Users, Car, MessageCircle, Phone, CreditCard } from 'lucide-react';
import { fetchPassengerBookings, subscribeToBookingsAndPassengers } from '@/lib/api/bookings';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface PassengerBookingsListProps {
  onUpdate?: () => void;
}

export const PassengerBookingsList: React.FC<PassengerBookingsListProps> = ({ onUpdate }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const refetchBookings = async () => {
    try {
      console.log('🔄 Refetching passenger bookings...');
      const data = await fetchPassengerBookings();
      setBookings(data);
      console.log('✅ Bookings updated:', data.length);
    } catch (error) {
      console.error('❌ Failed to refetch bookings:', error);
      toast({
        title: "Error",
        description: "Failed to refresh bookings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await fetchPassengerBookings();
      setBookings(data);
    } catch (error) {
      console.error('❌ Failed to load bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToBookingsAndPassengers(() => {
      console.log('🔄 Real-time update - refreshing bookings...');
      refetchBookings();
      onUpdate?.();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onUpdate]);

  const getStatusBadge = (booking: any) => {
    const hasDriver = booking.driver_id;
    const paymentStatus = booking.payment_confirmation_status;
    
    if (hasDriver && paymentStatus !== 'paid') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          PAYMENT PENDING
        </Badge>
      );
    }
    
    if (!hasDriver) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          PENDING DRIVER
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        CONFIRMED
      </Badge>
    );
  };

  const handlePayment = (booking: any) => {
    // Navigate to existing Stripe payment flow
    const price = booking.final_price || booking.estimated_price || 100;
    toast({
      title: "Payment",
      description: `Opening payment for $${price}...`,
    });
    // This would typically open the Stripe checkout
    // For now, just show a toast and refresh
    setTimeout(() => {
      refetchBookings();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
        <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Car className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-600 mb-6">Start your VIP journey by booking your first ride</p>
        <Button 
          onClick={() => navigate('/passenger/price-estimate')}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Book Your First Ride
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bookings.map((booking) => (
        <Card key={booking.booking_id} className="overflow-hidden shadow-sm">
          <CardContent className="p-6">
            {/* Pickup and Drop-off */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">Pickup</div>
                  <div className="text-gray-600 text-sm">{booking.pickup_location}</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">Drop-off</div>
                  <div className="text-gray-600 text-sm">{booking.dropoff_location}</div>
                </div>
              </div>
            </div>

            {/* Booking Meta */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(booking.pickup_time), 'MMM dd, yyyy - HH:mm')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>1 passengers</span>
              </div>
            </div>

            {/* Vehicle Info */}
            {booking.driver_car_make && booking.driver_car_model && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
                <Car className="w-4 h-4" />
                <span>{booking.driver_car_make} {booking.driver_car_model}</span>
              </div>
            )}

            {/* Price and Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold text-red-500">
                ${booking.final_price || booking.estimated_price || 100}
              </div>
              {getStatusBadge(booking)}
            </div>

            {/* Driver Info */}
            {booking.driver_id && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="font-medium text-gray-900 mb-3">Your Assigned Driver</div>
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={booking.driver_photo_url || undefined} />
                    <AvatarFallback>
                      {booking.driver_name ? booking.driver_name.charAt(0) : 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {booking.driver_name || 'Driver'}
                    </div>
                    <div className="text-blue-600 text-sm">
                      {booking.driver_car_make} {booking.driver_car_model}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {booking.driver_car_color} • {booking.driver_license_plate}
                    </div>
                  </div>
                </div>
                
                {/* Driver Action Buttons */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            )}

            {/* Payment CTA */}
            {booking.driver_id && booking.payment_confirmation_status !== 'paid' && (
              <Button 
                onClick={() => handlePayment(booking)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${booking.final_price || booking.estimated_price || 100} - Complete Booking
              </Button>
            )}

            {/* No status updates yet fallback */}
            {!booking.driver_id && (
              <div className="text-center py-6 text-gray-500">
                <p>Waiting for driver assignment...</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
