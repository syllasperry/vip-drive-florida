import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Car } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from "@/types/booking";
import { DispatcherBookingManager } from "./DispatcherBookingManager";
import { BookingManagementModal } from "./BookingManagementModal";
import { ReopenModalButton } from "../dashboard/ReopenModalButton";
import { WriteUnderlinedStatus } from "../ride/WriteUnderlinedStatus";
import { mapToSimpleStatus } from "@/utils/bookingHelpers";

interface DispatcherBookingListProps {
  onManageBooking?: () => void;
}

export const DispatcherBookingList = ({ onManageBooking }: DispatcherBookingListProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    setupRealtimeSubscription();
  }, []);

  const loadBookings = async () => {
    try {
      console.log('🔄 Loading all bookings for dispatcher...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers:passenger_id (
            id,
            full_name,
            phone,
            profile_photo_url
          ),
          drivers:driver_id (
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

      const processedBookings: Booking[] = (data || []).map(booking => ({
        id: booking.id,
        pickup_location: booking.pickup_location || '',
        dropoff_location: booking.dropoff_location || '',
        pickup_time: booking.pickup_time || '',
        passenger_count: booking.passenger_count || 1,
        vehicle_type: booking.vehicle_type,
        status: booking.status || 'pending',
        ride_status: booking.ride_status,
        payment_confirmation_status: booking.payment_confirmation_status,
        status_passenger: booking.status_passenger,
        status_driver: booking.status_driver,
        simple_status: mapToSimpleStatus(booking),
        estimated_price: booking.estimated_price,
        final_price: booking.final_price,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        passenger_id: booking.passenger_id || '',
        driver_id: booking.driver_id,
        vehicle_id: booking.vehicle_id,
        passengers: booking.passengers ? {
          id: booking.passengers.id,
          full_name: booking.passengers.full_name,
          phone: booking.passengers.phone,
          profile_photo_url: booking.passengers.profile_photo_url
        } : undefined,
        drivers: booking.drivers
      }));

      setBookings(processedBookings);
      console.log('📊 Dispatcher bookings loaded:', processedBookings.length);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dispatcher-booking-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Dispatcher real-time booking update:', payload);
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const handleManageBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleBookingUpdate = () => {
    loadBookings();
    if (onManageBooking) {
      onManageBooking();
    }
  };

  const handleReopenModal = (step: string) => {
    setIsModalOpen(true);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading bookings...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">Booking ID</span>
                        <WriteUnderlinedStatus booking={booking} userType="dispatcher" />
                      </div>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Booking ID */}
                    <div className="text-lg font-semibold text-gray-900 mb-4">
                      #{booking.id.slice(-8).toUpperCase()}
                    </div>

                    {/* Locations with vector icons */}
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
                          {format(new Date(booking.pickup_time), 'MMM dd, yyyy - HH:mm')}
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

                    {/* Price Display */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-green-600">
                        ${booking.final_price || booking.estimated_price || 0}
                      </span>
                    </div>

                    {/* Passenger Info */}
                    {booking.passengers && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-2">Passenger</p>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
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

                    {/* Driver Info */}
                    {booking.drivers && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">Assigned Driver</p>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.drivers.profile_photo_url} />
                            <AvatarFallback className="bg-blue-200 text-blue-800">
                              {booking.drivers.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">{booking.drivers.full_name}</p>
                            <p className="text-sm text-blue-500">{booking.drivers.phone}</p>
                            <p className="text-sm text-blue-500">
                              {booking.drivers.car_make} {booking.drivers.car_model} ({booking.drivers.car_color})
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleManageBooking(booking)}
                      >
                        Manage
                      </Button>
                      <ReopenModalButton booking={booking} onReopenModal={handleReopenModal} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BookingManagementModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        booking={selectedBooking || {} as Booking}
        onUpdate={handleBookingUpdate}
      />
    </div>
  );
};
