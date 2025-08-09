import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Phone, Car, LogOut } from 'lucide-react';
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { format } from 'date-fns';
import { Booking } from "@/types/booking";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    setupRealtimeSubscription();
    
    // Set up automatic refresh every 10 seconds
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing dispatcher dashboard...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email === 'syllasperry@gmail.com') {
          loadBookings();
        }
      } catch (error) {
        console.error('Error in auto-refresh:', error);
      }
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== 'syllasperry@gmail.com') {
        navigate('/passenger/login');
        return;
      }

      loadBookings();
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/passenger/login');
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dispatcher-bookings-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Enhanced real-time update for dispatcher:', payload);
          // Force refresh on any booking changes
          loadBookings();
        }
      )
      .subscribe((status) => {
        console.log('📡 Dispatcher subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadBookings = async () => {
    try {
      console.log('🔄 Loading bookings for dispatcher...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            full_name,
            phone,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            interaction_preference,
            trip_purpose,
            additional_notes
          ),
          drivers (
            full_name,
            phone,
            profile_photo_url,
            car_make,
            car_model,
            car_color,
            license_plate
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedBookings: Booking[] = (data || []).map(booking => {
        console.log('📋 Processing dispatcher booking:', {
          id: booking.id,
          status: booking.status,
          ride_status: booking.ride_status,
          final_price: booking.final_price,
          driver_id: booking.driver_id
        });

        return {
          id: booking.id,
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          pickup_time: booking.pickup_time,
          passenger_count: booking.passenger_count,
          vehicle_type: booking.vehicle_type,
          simple_status: mapToSimpleStatus(booking.status, booking.ride_status, booking.payment_confirmation_status),
          estimated_price: booking.estimated_price,
          final_negotiated_price: booking.final_price,
          final_price: booking.final_price,
          created_at: booking.created_at,
          passenger_id: booking.passenger_id,
          driver_id: booking.driver_id,
          status: booking.status,
          ride_status: booking.ride_status,
          payment_confirmation_status: booking.payment_confirmation_status,
          passengers: booking.passengers ? {
            id: booking.passenger_id,
            full_name: booking.passengers.full_name,
            phone: booking.passengers.phone,
            profile_photo_url: booking.passengers.profile_photo_url,
            preferred_temperature: booking.passengers.preferred_temperature,
            music_preference: booking.passengers.music_preference,
            interaction_preference: booking.passengers.interaction_preference,
            trip_purpose: booking.passengers.trip_purpose,
            additional_notes: booking.passengers.additional_notes
          } : undefined,
          drivers: booking.drivers ? {
            full_name: booking.drivers.full_name,
            phone: booking.drivers.phone,
            profile_photo_url: booking.drivers.profile_photo_url,
            car_make: booking.drivers.car_make,
            car_model: booking.drivers.car_model,
            car_color: booking.drivers.car_color,
            license_plate: booking.drivers.license_plate
          } : undefined
        };
      });

      console.log('📊 Dispatcher bookings loaded:', mappedBookings.length);
      setBookings(mappedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mapToSimpleStatus = (status?: string, rideStatus?: string, paymentStatus?: string): Booking['simple_status'] => {
    console.log('🔍 Dispatcher status mapping:', { status, rideStatus, paymentStatus });
    
    if (status === 'completed' || rideStatus === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    
    if (paymentStatus === 'all_set' || rideStatus === 'all_set') return 'all_set';
    
    // When dispatcher sends offer, show as payment_pending
    if (status === 'offer_sent' || rideStatus === 'offer_sent') {
      return 'payment_pending';
    }
    
    // If booking is pending and no driver assigned, show as booking_requested
    return 'booking_requested';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booking_requested': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'payment_pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'all_set': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booking_requested': return 'New Request';
      case 'payment_pending': return 'Offer Price Sent to Passenger';
      case 'all_set': return 'All Set';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/passenger/login');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">VIP Dispatcher Dashboard</h1>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">All Bookings</h2>
          <p className="text-gray-600">Manage ride requests and assignments</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500">New ride requests will appear here</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">#{booking.id.slice(-8).toUpperCase()}</span>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.simple_status)}`}>
                      {getStatusLabel(booking.simple_status)}
                    </Badge>
                  </div>

                  {/* Passenger Info */}
                  {booking.passengers && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">Passenger</p>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.passengers.profile_photo_url} />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {booking.passengers.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{booking.passengers.full_name}</p>
                          <p className="text-sm text-gray-500">{booking.passengers.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Locations */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <p className="text-sm font-medium text-gray-900">{booking.pickup_location}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-500">Drop-off</p>
                        <p className="text-sm font-medium text-gray-900">{booking.dropoff_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {formatDateTime(booking.pickup_time)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {booking.passenger_count} passengers
                      </span>
                    </div>
                    {booking.vehicle_type && (
                      <div className="flex items-center space-x-2 col-span-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">{booking.vehicle_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Price - always show final_price if available, otherwise estimated_price */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-red-600">
                      ${booking.final_price || booking.estimated_price || 0}
                    </span>
                    {booking.simple_status === 'booking_requested' && (
                      <DispatcherBookingManager
                        booking={booking}
                        onUpdate={loadBookings}
                      />
                    )}
                  </div>

                  {/* Driver Info - show when assigned */}
                  {booking.drivers && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">Assigned Driver</p>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={booking.drivers.profile_photo_url} />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {booking.drivers.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{booking.drivers.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {booking.drivers.car_make} {booking.drivers.car_model}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - only show for non-new-requests */}
                  {booking.simple_status !== 'booking_requested' && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherDashboard;
