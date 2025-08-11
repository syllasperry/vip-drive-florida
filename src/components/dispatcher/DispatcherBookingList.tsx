
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingManagementModal } from './BookingManagementModal';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Booking } from "@/types/booking";

interface DispatcherBookingListProps {
  onManageBooking: () => void;
}

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  profile_photo_url?: string;
  car_make: string;
  car_model: string;
  car_color: string;
  license_plate: string;
}

export const DispatcherBookingList: React.FC<DispatcherBookingListProps> = ({
  onManageBooking
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    loadDrivers();
    setupRealtimeSubscription();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      console.log('🔒 Loading bookings with secure access control');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers!inner(
            id,
            full_name,
            phone,
            profile_photo_url
          ),
          drivers(
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

      if (error) {
        console.error('❌ Error loading bookings:', error);
        throw error;
      }

      // Transform the data to match Booking interface
      const transformedBookings: Booking[] = (data || []).map(booking => ({
        ...booking,
        passengers: booking.passengers ? {
          id: booking.passengers.id,
          full_name: booking.passengers.full_name,
          phone: booking.passengers.phone,
          profile_photo_url: booking.passengers.profile_photo_url
        } : undefined
      }));

      setBookings(transformedBookings);
      console.log('✅ Loaded bookings:', transformedBookings.length);
    } catch (error) {
      console.error('❌ Error in loadBookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active');

      if (error) {
        console.error('❌ Error loading drivers:', error);
        throw error;
      }

      setDrivers(data || []);
      console.log('✅ Loaded drivers:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error in loadDrivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dispatcher-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          console.log('🔄 Real-time booking update detected');
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'offer_sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleManageBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedBooking(null);
    loadBookings();
    onManageBooking();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading secure bookings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No bookings found
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {booking.passengers?.full_name || 'Unknown Passenger'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        From: {booking.pickup_location}
                      </p>
                      <p className="text-sm text-gray-600">
                        To: {booking.dropoff_location}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.pickup_time).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Driver: {booking.drivers?.full_name || 'Not assigned'}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleManageBooking(booking)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Management Modal */}
      {showModal && selectedBooking && (
        <BookingManagementModal
          isOpen={showModal}
          onClose={handleModalClose}
          booking={selectedBooking}
          drivers={drivers}
          onUpdate={handleModalClose}
        />
      )}
    </>
  );
};
