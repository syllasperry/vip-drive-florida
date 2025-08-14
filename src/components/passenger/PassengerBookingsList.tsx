
import React, { useEffect, useState } from 'react';
import { fetchPassengerBookings, subscribeToBookingsAndPassengers } from '@/lib/api/bookings';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Clock, Users, Car, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PassengerBookingsListProps {
  onUpdate?: () => void;
}

interface PassengerBookingRPC {
  booking_id: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_time: string | null;
  passenger_count: number | null;
  status: string | null;
  ride_status: string | null;
  payment_confirmation_status: string | null;
  status_passenger: string | null;
  status_driver: string | null;
  estimated_price: number | null;
  final_price: number | null;
  created_at: string;
  updated_at: string | null;
  passenger_id: string;
  driver_id: string | null;
  passenger_name: string | null;
  passenger_email: string | null;
  passenger_phone: string | null;
  passenger_photo_url: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  driver_email: string | null;
  driver_photo_url: string | null;
  driver_car_make: string | null;
  driver_car_model: string | null;
  driver_license_plate: string | null;
}

export const PassengerBookingsList = ({ onUpdate }: PassengerBookingsListProps) => {
  const [bookings, setBookings] = useState<PassengerBookingRPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 PassengerBookingsList: Starting fetch via RPC...');
      
      const data = await fetchPassengerBookings();
      
      console.log('✅ PassengerBookingsList: RPC data received:', data);
      console.log('📊 PassengerBookingsList: Data length:', data?.length || 0);
      
      setBookings(data);
      setError(null);
      
      if (data.length > 0) {
        console.log(`✅ Successfully loaded ${data.length} bookings via RPC`);
      }
      
    } catch (error) {
      console.error('❌ PassengerBookingsList: Error fetching bookings via RPC:', error);
      
      let errorMessage = "Database connection error. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication') || error.message.includes('authenticated')) {
          errorMessage = "Please log in to view your bookings.";
        } else if (error.message.includes('Database') || error.message.includes('query')) {
          errorMessage = "Database connection error. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setBookings([]);
      
      console.error('Error set to state:', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    // Initial fetch
    fetchBookings();

    // Set up real-time subscription
    unsubscribe = subscribeToBookingsAndPassengers(() => {
      console.log('🔄 Real-time invalidation - reloading passenger bookings...');
      fetchBookings();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleUpdate = () => {
    fetchBookings();
    onUpdate?.();
  };

  const handleRetry = () => {
    console.log('🔄 Retry button clicked, refetching bookings...');
    fetchBookings();
  };

  const handlePayment = async (booking: PassengerBookingRPC) => {
    try {
      console.log('🔄 Initiating payment for booking:', booking.booking_id);
      
      // Call existing Stripe checkout integration
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          booking_id: booking.booking_id,
          amount: booking.estimated_price || booking.final_price || 0
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '$0';
    return `$${price}`;
  };

  const getStatusText = (booking: PassengerBookingRPC) => {
    if (booking.driver_id && booking.payment_confirmation_status !== 'paid') {
      return 'Offer Received';
    } else if (!booking.driver_id) {
      return 'Pending Driver';
    } else if (booking.payment_confirmation_status === 'paid') {
      return 'Confirmed';
    }
    return 'Pending';
  };

  const shouldShowPaymentCTA = (booking: PassengerBookingRPC) => {
    return booking.driver_id && booking.payment_confirmation_status !== 'paid';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2 text-gray-600">Loading your bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  onClick={handleRetry}
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't made any ride requests yet. Book your first ride to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.booking_id} className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            {/* Pickup and Drop-off */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">Pickup</div>
                  <div className="text-gray-600 text-sm">
                    {booking.pickup_location || 'Pickup location'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">Drop-off</div>
                  <div className="text-gray-600 text-sm">
                    {booking.dropoff_location || 'Drop-off location'}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking meta info */}
            <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  {booking.pickup_time 
                    ? format(new Date(booking.pickup_time), 'MMM d, yyyy - HH:mm')
                    : 'Time TBD'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{booking.passenger_count || 1} passengers</span>
              </div>
            </div>

            {/* Vehicle info */}
            {(booking.driver_car_make || booking.driver_car_model) && (
              <div className="flex items-center space-x-1 mb-4 text-sm text-gray-600">
                <Car className="h-4 w-4" />
                <span>
                  {booking.driver_car_make && booking.driver_car_model 
                    ? `${booking.driver_car_make} ${booking.driver_car_model}`
                    : booking.driver_car_model || 'Vehicle TBD'
                  }
                </span>
              </div>
            )}

            {/* Price and Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold text-red-500">
                {formatPrice(booking.estimated_price || booking.final_price)}
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                {getStatusText(booking)}
              </Badge>
            </div>

            {/* Assigned Driver Section */}
            {booking.driver_id && booking.driver_name && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Your Assigned Driver</div>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={booking.driver_photo_url || undefined} />
                    <AvatarFallback>
                      {booking.driver_name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900">{booking.driver_name}</div>
                    <div className="text-blue-600 text-sm">
                      {booking.driver_car_make && booking.driver_car_model 
                        ? `${booking.driver_car_make} ${booking.driver_car_model}`
                        : 'Vehicle TBD'
                      }
                    </div>
                    {booking.driver_license_plate && (
                      <div className="text-gray-500 text-sm">
                        Silver • {booking.driver_license_plate}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            )}

            {/* Payment CTA */}
            {shouldShowPaymentCTA(booking) && (
              <Button
                onClick={() => handlePayment(booking)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg"
              >
                Pay {formatPrice(booking.estimated_price || booking.final_price)} - Complete Booking
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
