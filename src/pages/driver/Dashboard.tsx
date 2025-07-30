import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, MessageCircle, Star, DollarSign, Car, User, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { EarningsSection } from "@/components/dashboard/EarningsSection";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { UpcomingRideCard } from "@/components/dashboard/UpcomingRideCard";
import { BookingToggle } from "@/components/dashboard/BookingToggle";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import { SettingsModal } from "@/components/SettingsModal";
import { EnhancedSettingsModal } from "@/components/EnhancedSettingsModal";
import { DriverSettingsModal } from "@/components/DriverSettingsModal";
import { DriverScheduleModal } from "@/components/DriverScheduleModal";
import { DriverPreferencesModal } from "@/components/DriverPreferencesModal";
import { DriverPaymentSettingsModal } from "@/components/DriverPaymentSettingsModal";
import { DriverPaymentMethodsModal } from "@/components/DriverPaymentMethodsModal";
import PendingRequestAlert from "@/components/dashboard/PendingRequestAlert";
import { ReviewModal } from "@/components/ReviewModal";
import { MessagingInterface } from "@/components/MessagingInterface";
import { CancelBookingButton } from "@/components/dashboard/CancelBookingButton";
import { EnhancedBookingCard } from "@/components/booking/EnhancedBookingCard";
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Ride {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  passenger: string;
  passengers?: any;
  status: string;
  ride_status?: string;
  driver_id?: string;
  payment: string;
  paymentMethod?: string | null;
  countdown?: string | null;
  flight_info?: string;
  passenger_count?: number;
  luggage_count?: number;
  vehicle_type?: string;
  final_price?: number;
  passenger_id?: string;
  payment_status?: string;
}

interface DriverProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
  car_make?: string;
  car_model?: string;
  car_year?: string;
  car_color?: string;
  license_plate?: string;
  payment_instructions?: string;
  preferred_payment_method?: string;
  payment_methods_accepted?: string[];
  payment_methods_credit_cards?: string[];
  payment_methods_digital?: string[];
  cancellation_policy?: string;
  zelle_info?: string;
  venmo_info?: string;
  apple_pay_info?: string;
  google_pay_info?: string;
  payment_link_info?: string;
}

export default function DriverDashboard() {
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [activeTab, setActiveTab] = useState<string>("rides");
  const [rideView, setRideView] = useState<"upcoming" | "past">("upcoming");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEnhancedSettings, setShowEnhancedSettings] = useState(false);
  const [showDriverSettings, setShowDriverSettings] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showPaymentSettingsModal, setShowPaymentSettingsModal] = useState(false);
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<DriverProfile | null>(null);
  const [showMessagingInterface, setShowMessagingInterface] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user and fetch profile
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch driver profile
        const { data: profile, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching driver profile:', error);
          return;
        }

        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    getCurrentUser();
  }, []);

  // Enhanced data fetching function with real-time support
  useEffect(() => {
    if (!userProfile?.id) return;

    const fetchDriverBookings = async () => {
      try {
        console.log('Driver profile for matching:', userProfile);
        console.log('Fetching pending bookings...');

        // Get pending bookings that match this driver's vehicle type
        let pendingBookingsQuery = supabase
          .from('bookings')
          .select(`
            *,
            passengers:passenger_id (
              id,
              full_name,
              phone,
              email,
              profile_photo_url,
              preferred_temperature,
              music_preference,
              music_playlist_link,
              interaction_preference,
              trip_purpose,
              additional_notes
            ),
            vehicles:vehicle_id (
              id,
              type,
              description
            )
          `)
          .eq('ride_status', 'pending_driver')
          .is('driver_id', null);

        // Add vehicle type filter if driver has car info
        if (userProfile?.car_make && userProfile?.car_model) {
          const vehicleSearchTerm = `${userProfile.car_make} ${userProfile.car_model}`;
          console.log('Looking for vehicle type:', vehicleSearchTerm);
          pendingBookingsQuery = pendingBookingsQuery.or(`vehicle_type.ilike.%${vehicleSearchTerm}%,vehicle_type.is.null`);
        }

        const [assignedBookings, pendingBookings] = await Promise.all([
          // Get bookings assigned to this driver
          supabase
            .from('bookings')
            .select(`
              *,
              passengers:passenger_id (
                id,
                full_name,
                phone,
                email,
                profile_photo_url,
                preferred_temperature,
                music_preference,
                music_playlist_link,
                interaction_preference,
                trip_purpose,
                additional_notes
              ),
              vehicles:vehicle_id (
                id,
                type,
                description
              )
            `)
            .eq('driver_id', userProfile.id)
            .order('pickup_time', { ascending: true }),
          
          pendingBookingsQuery.order('pickup_time', { ascending: true })
        ]);

        console.log('Assigned bookings result:', assignedBookings);
        console.log('Pending bookings result:', pendingBookings);

        if (assignedBookings.error) {
          console.error('Error fetching assigned bookings:', assignedBookings.error);
          return;
        }

        if (pendingBookings.error) {
          console.error('Error fetching pending bookings:', pendingBookings.error);
        }

        // Combine and deduplicate bookings
        const allBookingsData = [
          ...(assignedBookings.data || []),
          ...(pendingBookings.data || [])
        ].filter((booking, index, self) => 
          index === self.findIndex(b => b.id === booking.id)
        );

        // Transform Supabase data to match expected format
        const transformedBookings = allBookingsData.map(booking => {
          const pickupDate = new Date(booking.pickup_time);
          return {
            id: booking.id,
            date: pickupDate.toISOString().split('T')[0],
            time: pickupDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            from: booking.pickup_location,
            to: booking.dropoff_location,
            passenger: booking.passengers?.full_name || 'Unknown Passenger',
            passengers: booking.passengers, // Include full passenger data for avatar
            status: booking.status,
            ride_status: booking.ride_status,
            driver_id: booking.driver_id,
            payment: "$120.00", // TODO: Calculate real price
            paymentMethod: booking.payment_status === 'completed' ? 'Completed' : null,
            countdown: null,
            flight_info: booking.flight_info,
            passenger_count: booking.passenger_count,
            luggage_count: booking.luggage_count,
            vehicle_type: booking.vehicle_type || 'Vehicle',
            final_price: booking.final_price,
            passenger_id: booking.passenger_id,
            payment_status: booking.payment_status
          };
        });

        console.log('Fetched bookings for driver:', transformedBookings);
        console.log('Pending bookings:', transformedBookings.filter(ride => 
          ride.status === "pending" || 
          (ride.ride_status === "pending_driver" && !ride.driver_id)
        ));
        setDriverRides(transformedBookings);
      } catch (error) {
        console.error('Error fetching driver bookings:', error);
      }
    };

    fetchDriverBookings();

    // Set up real-time subscription for new bookings
    const channel = supabase
      .channel('driver-new-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('New booking created:', payload);
          
          // Check if this booking is available for this driver (Tesla Model Y match)
          const isCompatibleVehicle = payload.new.vehicle_type && 
            userProfile?.car_make && userProfile?.car_model &&
            payload.new.vehicle_type.toLowerCase().includes(
              `${userProfile.car_make} ${userProfile.car_model}`.toLowerCase()
            );
          
          // Check if it's a new pending booking without driver assignment
          const isPendingForDriver = payload.new.ride_status === 'pending_driver' && 
            !payload.new.driver_id;
          
          if (isPendingForDriver && (isCompatibleVehicle || !payload.new.vehicle_type)) {
            console.log('New pending booking available for driver:', payload);
            fetchDriverBookings();
            
            // Show visual and audio notification
            toast({
              title: "🚨 NEW RIDE REQUEST!",
              description: `New ${payload.new.vehicle_type || 'ride'} booking request received!`,
              variant: "default",
            });

            // Play notification sound (if supported)
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCE');
              audio.play();
            } catch (e) {
              console.log('Audio notification not supported');
            }
          } else if (payload.new.driver_id === userProfile?.id) {
            // Handle bookings assigned directly to this driver
            console.log('New booking assigned to driver:', payload);
            fetchDriverBookings();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `driver_id=eq.${userProfile?.id}`
        },
        () => {
          fetchDriverBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, toast]);

  // Filter rides based on current view
  const filteredRides = driverRides.filter(ride => {
    const rideDate = new Date(ride.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (rideView === "upcoming") {
      return rideDate >= today && ride.status !== "completed";
    } else {
      return rideDate < today || ride.status === "completed";
    }
  });

  const handleOfferAccepted = (requestId: string, offeredPrice: number) => {
    console.log('Offer accepted for request:', requestId, 'Price:', offeredPrice);
    // Handle the accepted offer
  };

  const handleOfferDeclined = (requestId: string) => {
    console.log('Offer declined for request:', requestId);
    // Handle the declined offer
  };

  const handleRideAction = (rideId: string, action: string) => {
    console.log(`Action ${action} for ride ${rideId}`);
    // Handle ride actions
  };

  const handleMessageClick = (rideId: string, passengers?: any) => {
    console.log('Opening message for ride:', rideId);
    setSelectedConversationId(rideId);
    setShowMessagingInterface(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          ride_status: 'cancelled',
          driver_id: null
        })
        .eq('id', bookingId)
        .eq('driver_id', userProfile?.id);

      if (error) throw error;

      toast({
        title: "Booking cancelled",
        description: "You have successfully cancelled this booking.",
      });

      // Refresh bookings
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewBooking = (ride: Ride) => {
    setSelectedRide(ride);
  };

  const handleReviewDriver = (ride: Ride) => {
    setSelectedBookingId(ride.id);
    setShowReviewModal(true);
  };

  const handleEditProfile = () => {
    setShowDriverSettings(true);
  };

  // Group rides by date
  const groupedRides = filteredRides.reduce((groups: { [key: string]: Ride[] }, ride) => {
    const date = ride.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(ride);
    return groups;
  }, {});

  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d");
  };

  const getNextRide = () => {
    const upcomingRides = driverRides.filter(ride => {
      const rideDate = new Date(ride.date);
      const now = new Date();
      return rideDate >= now && (ride.status === "confirmed" || ride.status === "payment_confirmed");
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return upcomingRides[0] || null;
  };

  const nextRide = getNextRide();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
        <ProfileHeader 
          userProfile={userProfile}
          userType="driver"
          onPhotoUpload={async () => {}}
        />

      {/* Main Content */}
      <div className="px-4 pb-20">
        {/* Next Ride Card */}
        {nextRide && (
          <UpcomingRideCard 
            ride={nextRide}
            userType="driver"
            onMessage={() => {}}
          />
        )}

        {/* Earnings Section */}
        <EarningsSection driverId={userProfile?.id || ''} />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-6">
            <TabsTrigger value="rides">Rides</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Rides Tab */}
          <TabsContent value="rides" className="space-y-6">
            {/* Pending Requests Alert */}
            {activeTab === "rides" && (
              <PendingRequestAlert 
                requests={driverRides.filter(ride => 
                  ride.status === "pending" || 
                  (ride.ride_status === "pending_driver" && !ride.driver_id)
                ).map(ride => ({
                  id: ride.id,
                  passenger: ride.passenger,
                  passengers: ride.passengers,
                  from: ride.from,
                  to: ride.to,
                  time: ride.time,
                  date: ride.date,
                  pickup_time: ride.date + 'T' + ride.time,
                  passenger_count: ride.passenger_count || 1,
                  luggage_count: ride.luggage_count || 0,
                  vehicle_type: ride.vehicle_type || 'Vehicle',
                  flight_info: ride.flight_info || '',
                  estimated_price: ride.final_price || 120,
                  timeLeft: 900 // 15 minutes countdown
                }))}
                onAccept={handleOfferAccepted}
                onDecline={handleOfferDeclined}
              />
            )}

            {/* Booking Toggle */}
        <BookingToggle 
          activeView={rideView}
          onViewChange={setRideView}
        />

            {/* Rides List */}
            <div className="space-y-4">
              {Object.entries(groupedRides).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Car className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      {rideView === "upcoming" ? "No upcoming rides" : "No past rides"}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {rideView === "upcoming" 
                        ? "New ride requests will appear here" 
                        : "Completed rides will show up here"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(groupedRides).map(([date, rides]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-700">
                      {formatDateHeader(date)}
                    </h3>
                    {rides.map((ride) => (
                      <EnhancedBookingCard
                        key={ride.id}
                        booking={{
                          id: ride.id,
                          pickup_location: ride.from,
                          dropoff_location: ride.to,
                          pickup_time: ride.date + 'T' + ride.time,
                          status: ride.status,
                          final_price: ride.final_price,
                          passenger_count: ride.passenger_count || 1,
                          luggage_count: ride.luggage_count || 0,
                          vehicle_type: ride.vehicle_type,
                          passenger_id: ride.passenger_id,
                          driver_id: ride.driver_id,
                          flight_info: ride.flight_info,
                          passengers: ride.passengers
                        }}
                        userType="driver"
                        onMessage={() => handleMessageClick(ride.id, ride.passengers)}
                        onCancelBooking={() => handleCancelBooking(ride.id)}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessagesTab 
              userType="driver"
              userId={userProfile?.id || ''}
              onSelectChat={(booking, otherUser) => handleMessageClick(booking.id, otherUser)}
            />
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <EarningsSection driverId={userProfile?.id || ''} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="driver"
      />

      {/* Modals */}
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        type="notifications"
        userId={userProfile?.id}
        userType="driver"
      />

      <DriverSettingsModal 
        isOpen={showDriverSettings}
        onClose={() => setShowDriverSettings(false)}
        settingType="notifications"
      />

      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        bookingId={selectedBookingId || ''}
      />
    </div>
  );
}