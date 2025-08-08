import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { BookingToggle } from '@/components/dashboard/BookingToggle';
import { OrganizedBookingsList } from '@/components/dashboard/OrganizedBookingsList';
import { MessagesTab } from '@/components/dashboard/MessagesTab';
import { EarningsSection } from '@/components/dashboard/EarningsSection';
import { PaymentsTab } from '@/components/PaymentsTab';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { MessagingInterface } from '@/components/MessagingInterface';
import { PassengerDetailsModal } from '@/components/PassengerDetailsModal';

const Dashboard = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [messageBookingId, setMessageBookingId] = useState<string | null>(null);
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', userData.user?.id)
          .single();

        if (driverError) throw driverError;

        setDriverData(driverData);
        setIsAvailable(driverData?.is_available || false);
      } catch (error: any) {
        console.error("Error fetching driver data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch driver data",
          variant: "destructive"
        });
      }
    };

    fetchDriverData();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            passengers (
              id,
              full_name,
              phone,
              profile_photo_url,
              preferred_temperature,
              music_preference,
              interaction_preference,
              trip_purpose,
              additional_notes,
              music_playlist_link
            )
            `)
          .eq('driver_id', driverData?.id);

        if (error) throw error;

        setBookings(data || []);
      } catch (error: any) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to fetch bookings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (driverData) {
      fetchBookings();
    }
  }, [driverData]);

  useEffect(() => {
    const setupRealtime = async () => {
      await supabase
        .channel('public:bookings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async (payload) => {
          console.log('Change received!', payload)
          // Fetch updated bookings
          try {
            const { data, error } = await supabase
              .from('bookings')
              .select(`
                *,
                passengers (
                  id,
                  full_name,
                  phone,
                  profile_photo_url,
                  preferred_temperature,
                  music_preference,
                  interaction_preference,
                  trip_purpose,
                  additional_notes,
                  music_playlist_link
                )
                `)
              .eq('driver_id', driverData?.id);

            if (error) throw error;

            setBookings(data || []);
          } catch (error: any) {
            console.error("Error fetching updated bookings:", error);
            toast({
              title: "Error",
              description: "Failed to fetch updated bookings",
              variant: "destructive"
            });
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel('public:bookings');
      };
    };

    if (driverData) {
      setupRealtime();
    }
  }, [driverData]);

  const handleAction = async (action: string, bookingId: string) => {
    console.log(`🎬 Driver Dashboard: Handling action ${action} for booking ${bookingId}`);
    
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        console.error('❌ Booking not found:', bookingId);
        return;
      }

      switch (action) {
        case 'message':
          console.log('💬 Opening message interface for booking:', bookingId);
          setMessageBookingId(bookingId);
          break;

        case 'call':
          console.log('📞 Initiating call to passenger');
          if (booking.passengers?.phone) {
            window.location.href = `tel:${booking.passengers.phone}`;
          } else {
            toast({
              title: "Phone Number Not Available",
              description: "Passenger's phone number is not available.",
              variant: "destructive"
            });
          }
          break;

        case 'view_details':
          console.log('👤 Opening passenger details for booking:', bookingId);
          setSelectedPassenger(booking.passengers);
          setSelectedBooking(booking);
          setShowPassengerDetails(true);
          break;

        case 'accept':
          console.log('✅ Accepting ride request...');
          await supabase
            .from('bookings')
            .update({ 
              driver_id: driverData.id,
              status_driver: 'driver_accepted',
              ride_status: 'driver_accepted',
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

          toast({
            title: "Ride Accepted",
            description: "You have accepted this ride request. Please send your offer.",
          });
          break;

        case 'decline':
          console.log('❌ Declining ride request...');
          await supabase
            .from('bookings')
            .update({ 
              status_driver: 'driver_rejected',
              ride_status: 'driver_rejected',
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

          toast({
            title: "Ride Declined",
            description: "You have declined this ride request.",
          });
          break;

        default:
          console.warn('⚠️ Unknown action:', action);
      }
    } catch (error) {
      console.error('❌ Error handling action:', error);
      toast({
        title: "Action Failed",
        description: "There was an error processing your request.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!driverData) {
    return <div className="flex justify-center items-center h-screen">Fetching driver data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <ProfileHeader 
          user={driverData} 
          userType="driver" 
          isAvailable={isAvailable}
          onAvailabilityChange={setIsAvailable}
        />
        
        <Tabs defaultValue="rides" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rides">Rides</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rides" className="px-4 pb-20">
            <BookingToggle 
              isAvailable={isAvailable}
              onToggle={setIsAvailable}
            />
            
            <OrganizedBookingsList 
              bookings={bookings}
              userType="driver"
              onAction={handleAction}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="messages" className="px-4 pb-20">
            <MessagesTab userType="driver" />
          </TabsContent>
          
          <TabsContent value="payments" className="px-4 pb-20">
            <EarningsSection driverId={driverData?.id} />
            <PaymentsTab />
          </TabsContent>
        </Tabs>

        <BottomNavigation userType="driver" />

        {messageBookingId && (
          <MessagingInterface
            isOpen={true}
            onClose={() => setMessageBookingId(null)}
            userType="driver"
            bookingId={messageBookingId}
            currentUserId={driverData?.id || ''}
            currentUserName={driverData?.full_name || 'Driver'}
            currentUserAvatar={driverData?.profile_photo_url}
            otherUserName={bookings.find(b => b.id === messageBookingId)?.passengers?.full_name}
            otherUserAvatar={bookings.find(b => b.id === messageBookingId)?.passengers?.profile_photo_url}
          />
        )}

        <PassengerDetailsModal
          isOpen={showPassengerDetails}
          onClose={() => setShowPassengerDetails(false)}
          passenger={selectedPassenger}
          booking={selectedBooking}
        />
      </div>
    </div>
  );
};

export default Dashboard;
