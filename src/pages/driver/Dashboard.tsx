import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessagingInterface } from "@/components/MessagingInterface";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import { PriceEditModal } from "@/components/PriceEditModal";
import { DriverScheduleModal } from "@/components/DriverScheduleModal";
import { DriverSettingsModal } from "@/components/DriverSettingsModal";
import { DriverPaymentMethodsModal } from "@/components/DriverPaymentMethodsModal";
import { DriverPreferencesModal } from "@/components/DriverPreferencesModal";
import { PaymentConfirmationModal } from "@/components/PaymentConfirmationModal";
import { DriverPaymentSettingsModal } from "@/components/DriverPaymentSettingsModal";
import { NotificationManager } from "@/components/NotificationManager";
import { ChatNotificationBadge } from "@/components/ChatNotificationBadge";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { UpcomingRideCard } from "@/components/dashboard/UpcomingRideCard";
import { EarningsSection } from "@/components/dashboard/EarningsSection";
import { BookingToggle } from "@/components/dashboard/BookingToggle";
import { BookingCard } from "@/components/dashboard/BookingCard";
import OrganizedBookingsList from "@/components/dashboard/OrganizedBookingsList";
import PendingRequestAlert from "@/components/dashboard/PendingRequestAlert";
import StatusTracker, { BookingStatus } from "@/components/StatusTracker";
import { StatusBadges } from "@/components/status/StatusBadges";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car, DollarSign, User, LogOut, Clock, CheckCircle, Calendar, MessageCircle, Edit, CreditCard, Settings, Navigation, MapPin, Users, Map, ChevronDown, AlertCircle, Download, Mail, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookingSummaryModal } from "@/components/BookingSummaryModal";
import { ContributorInfoModal } from "@/components/pdf/ContributorInfoModal";
import { PDFGenerator } from "@/components/pdf/PDFGenerator";


const DriverDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State declarations
  const [activeTab, setActiveTab] = useState("rides");
  const [rideView, setRideView] = useState<"new-requests" | "new-rides" | "past-rides">("new-requests");
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"notifications" | "privacy" | null>(null);
  const [driverPreferencesModalOpen, setDriverPreferencesModalOpen] = useState(false);
  const [selectedBookingForMessaging, setSelectedBookingForMessaging] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [passengerProfile, setPassengerProfile] = useState<any>(null);
  const [priceEditModal, setPriceEditModal] = useState<{ isOpen: boolean; booking: any }>({ isOpen: false, booking: null });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);
  const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [pdfAction, setPdfAction] = useState<'download' | 'email'>('download');
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Authentication check and user data fetching
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/driver/login");
          return;
        }

        setIsAuthenticated(true);
        
        // Fetch driver profile
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching driver profile:', error);
          toast({
            title: "Error", 
            description: "Failed to load driver profile",
            variant: "destructive",
          });
        } else if (!driver) {
          // No driver profile found, this might be a new user
          console.log('No driver profile found for user:', session.user.id);
          toast({
            title: "Profile Setup Required",
            description: "Please complete your driver profile setup",
            variant: "default",
          });
        } else {
          setUserProfile(driver);
          // If authentication is successful, start fetching bookings
          fetchDriverBookings(driver);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate("/driver/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [navigate, toast]);

  const [driverRides, setDriverRides] = useState<any[]>([]);

  // Filter rides based on current view
  const filteredRides = driverRides.filter(ride => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Current view:', rideView);
    console.log('Ride:', ride.id, 'Status:', ride.status, 'Payment status:', ride.payment_confirmation_status);
    console.log('Passenger:', ride.passenger, 'Passengers object:', ride.passengers);
    
    if (rideView === "new-requests") {
      // New Requests: rides waiting for payment confirmation that haven't reached "all_set" status
      const isNewRequest = ride.payment_confirmation_status !== "all_set" && 
                          ride.status !== "completed" &&
                          (ride.ride_status === "pending_driver" || 
                           ride.payment_confirmation_status === "price_awaiting_acceptance" ||
                           ride.payment_confirmation_status === "waiting_for_payment" ||
                           ride.payment_confirmation_status === "passenger_paid");
      console.log('Is new request:', isNewRequest);
      return isNewRequest;
    } else if (rideView === "new-rides") {
      // New Rides: confirmed rides (All Set) that are ready to be performed but not completed yet
      const isNewRide = ride.payment_confirmation_status === "all_set" && 
                       ride.status !== "completed";
      console.log('Is new ride:', isNewRide);
      return isNewRide;
    } else {
      // Past Rides: only rides that have been completed
      const isPastRide = ride.status === "completed";
      console.log('Is past ride:', isPastRide);
      return isPastRide;
    }
  });
  
  console.log('=== FILTERED RESULTS ===');
  console.log('Total driver rides:', driverRides.length);
  console.log('Filtered rides for', rideView, ':', filteredRides.length);
  console.log('All Set rides:', driverRides.filter(r => r.payment_confirmation_status === "all_set"));
  console.log('Completed rides:', driverRides.filter(r => r.status === "completed"));

  const fetchDriverBookings = async (profile: any) => {
      try {
        console.log('=== FETCHING DRIVER BOOKINGS ===');
        console.log('Driver profile:', profile);
        console.log('Driver ID:', profile?.id);
        console.log('Car make/model:', profile?.car_make, profile?.car_model);

        const [assignedBookings, pendingBookings] = await Promise.all([
          // Fetch bookings already assigned to this driver
          supabase
            .from('bookings')
            .select(`
              *,
              passengers:passenger_id (
                id,
                full_name,
                email,
                phone,
                profile_photo_url,
                preferred_temperature,
                music_preference,
                music_playlist_link,
                interaction_preference,
                trip_purpose,
                additional_notes
              )
            `)
            .eq('driver_id', profile.id)
            .order('pickup_time', { ascending: true }),
          
          // Fetch new bookings that match this driver's vehicle (pending_driver status)
          supabase
            .from('bookings')
            .select(`
              *,
              passengers:passenger_id (
                id,
                full_name,
                email,
                phone,
                profile_photo_url,
                preferred_temperature,
                music_preference,
                music_playlist_link,
                interaction_preference,
                trip_purpose,
                additional_notes
              )
            `)
            .eq('ride_status', 'pending_driver')
            .is('driver_id', null)
            .order('pickup_time', { ascending: true })
        ]);

        if (assignedBookings.error) {
          console.error('Error fetching assigned bookings:', assignedBookings.error);
          return;
        }

        if (pendingBookings.error) {
          console.error('Error fetching pending bookings:', pendingBookings.error);
        }

        // Filter pending bookings to match driver's vehicle make (first word only)
        const filteredPendingBookings = (pendingBookings.data || []).filter(booking => {
          if (!booking.vehicle_type || !profile.car_make) return true; // Show if no vehicle specified
          
          const requestedMake = booking.vehicle_type.split(' ')[0].toLowerCase();
          const driverMake = profile.car_make.toLowerCase();
          
          return requestedMake === driverMake;
        });

        // Combine and deduplicate bookings
        const allBookingsData = [
          ...(assignedBookings.data || []),
          ...filteredPendingBookings
        ].filter((booking, index, self) => 
          index === self.findIndex(b => b.id === booking.id)
        );

        // Transform Supabase data to match expected format and sort by pickup time
        const transformedBookings = allBookingsData
          .map(booking => {
            const pickupDate = new Date(booking.pickup_time);
            return {
              id: booking.id,
              date: pickupDate.toISOString().split('T')[0],
              time: pickupDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }),
              pickup_time: booking.pickup_time,
              pickup_location: booking.pickup_location,
              dropoff_location: booking.dropoff_location,
              from: booking.pickup_location,
              to: booking.dropoff_location,
              passenger: booking.passengers?.full_name || 'Unknown Passenger',
              passengers: booking.passengers,
              status: booking.status,
              ride_status: booking.ride_status,
              driver_id: booking.driver_id,
              payment: booking.final_price ? `$${booking.final_price}` : (booking.estimated_price ? `$${booking.estimated_price}` : "TBD"),
              paymentMethod: booking.payment_status === 'completed' ? 'Completed' : null,
              countdown: null,
              flight_info: booking.flight_info,
              passenger_count: booking.passenger_count || 1,
              luggage_count: booking.luggage_count || 0,
              vehicle_type: booking.vehicle_type || 'Vehicle',
              final_price: booking.final_price,
              estimated_price: booking.estimated_price,
              passenger_id: booking.passenger_id,
              payment_status: booking.payment_status,
              payment_confirmation_status: booking.payment_confirmation_status
            };
          })
          .sort((a, b) => {
            const dateA = new Date(a.pickup_time);
            const dateB = new Date(b.pickup_time);
            return dateA.getTime() - dateB.getTime();
          });

        setDriverRides(transformedBookings);
      } catch (error) {
        console.error('Error fetching driver bookings:', error);
      }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "Driver profile not loaded",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update booking with driver_id, status, and price if provided
      const updateData: any = { 
        status: 'accepted',
        driver_id: userProfile.id
      };
      
      if (price) {
        updateData.final_price = price;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', rideId)
        .eq('status', 'pending'); // Only update if still pending

      if (error) {
        console.error('Error accepting ride:', error);
        toast({
          title: "Error",
          description: `Failed to accept ride: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Send email notification
      try {
        await supabase.functions.invoke('send-booking-notifications', {
          body: {
            bookingId: rideId,
            status: 'accepted',
            triggerType: 'status_change'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      // Update local state
      setDriverRides(prevRides => 
        prevRides.map(ride => 
          ride.id === rideId 
            ? { ...ride, status: "accepted" }
            : ride
        )
      );

      toast({
        title: "Ride Accepted!",
        description: "The passenger has been notified.",
      });
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRide = async (rideId: string) => {
    try {
      // Update booking status to declined (no driver_id assignment needed)
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'declined' })
        .eq('id', rideId)
        .eq('status', 'pending'); // Only update if still pending

      if (error) {
        console.error('Error declining ride:', error);
        toast({
          title: "Error",
          description: `Failed to decline ride: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Send email notification
      try {
        await supabase.functions.invoke('send-booking-notifications', {
          body: {
            bookingId: rideId,
            status: 'declined',
            triggerType: 'status_change'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      // Update local state (remove from driver's list since they declined it)
      setDriverRides(prevRides => 
        prevRides.filter(ride => ride.id !== rideId)
      );

      toast({
        title: "Ride Declined",
        description: "The booking has been declined.",
      });
    } catch (error) {
      console.error('Error declining ride:', error);
      toast({
        title: "Error",
        description: "Failed to decline ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPaymentFromCard = async (booking: any) => {
    try {
      console.log('Confirming payment for booking:', booking.id);
      console.log('Current user:', userProfile?.id);
      console.log('Booking driver_id:', booking.driver_id);
      console.log('Current booking status:', booking.payment_confirmation_status);

      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          ride_status: 'paid',
          payment_confirmation_status: 'all_set',
          driver_payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      console.log('Update result:', { data, error });

      if (error) throw error;

      // Update local state to reflect changes immediately
      setDriverRides(prevRides => 
        prevRides.map(ride => 
          ride.id === booking.id 
            ? { 
                ...ride, 
                status: 'all_set',
                ride_status: 'paid',
                payment_confirmation_status: 'all_set' 
              }
            : ride
        )
      );

      toast({
        title: "Payment Confirmed!",
        description: "✅ All set! Both passenger and driver are notified.",
      });

    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewSummary = (booking: any) => {
    setSelectedBooking(booking);
    setShowSummaryModal(true);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!userProfile?.id) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userProfile.id}.${fileExt}`;
    const filePath = `${userProfile.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo",
        variant: "destructive",
      });
      return;
    }

    const { data: publicURLData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicURL = publicURLData?.publicUrl;

    const { error: updateError } = await supabase
      .from('drivers')
      .update({ profile_photo_url: publicURL })
      .eq('id', userProfile.id);

    if (updateError) {
      console.error(updateError);
      toast({
        title: "Update failed", 
        description: "Failed to update profile photo",
        variant: "destructive",
      });
    } else {
      setUserProfile((prev: any) => ({
        ...prev,
        profile_photo_url: publicURL,
      }));

      toast({
        title: "Photo updated!",
        description: "Your profile photo has been successfully uploaded.",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/driver/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // This will trigger redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <ProfileHeader 
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="container mx-auto p-4 pb-20 space-y-6">
        {/* Tab Content */}
        {activeTab === "rides" && (
          <div className="space-y-4">
            {/* Enhanced Rides Header with Three Tabs */}
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-border/50">
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setRideView("new-requests")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    rideView === "new-requests"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  New Requests
                </button>
                <button
                  onClick={() => setRideView("new-rides")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    rideView === "new-rides"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  New Rides
                </button>
                <button
                  onClick={() => setRideView("past-rides")}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                    rideView === "past-rides"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Past Rides
                </button>
              </div>
            </div>

            {/* New Requests Tab */}
            {rideView === "new-requests" && (
              <div className="space-y-3">
                {filteredRides.length === 0 ? (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">No new requests</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        New ride requests will appear here when passengers book your vehicle.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRides.map((ride) => (
                    <BookingCard
                      key={ride.id}
                      booking={ride}
                      userType="driver"
                      onMessage={(booking) => {
                        setSelectedBookingForMessaging(booking);
                        if (booking.passenger_id) {
                          supabase
                            .from('passengers')
                            .select('*')
                            .eq('id', booking.passenger_id)
                            .maybeSingle()
                            .then(({ data: passenger, error }) => {
                              if (passenger && !error) {
                                setPassengerProfile(passenger);
                              }
                            });
                        }
                        setMessagingOpen(true);
                      }}
                      onViewSummary={(booking) => handleViewSummary(booking)}
                      onCancelSuccess={() => fetchDriverBookings(userProfile)}
                      showPaymentReceivedButton={ride.payment_confirmation_status === 'passenger_paid'}
                      onConfirmPaymentReceived={() => handleConfirmPaymentFromCard(ride)}
                    />
                  ))
                )}
              </div>
            )}

            {/* New Rides Tab */}
            {rideView === "new-rides" && (
              <div className="space-y-4">
                {/* Header */}
                <div className="text-center py-4">
                  <h2 className="text-2xl font-bold text-foreground mb-2">📝 To-Do List – Confirmed Rides</h2>
                  <p className="text-sm text-muted-foreground">
                    Rides ready to be performed ({filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''})
                  </p>
                </div>

                {filteredRides.length === 0 ? (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                        <Car className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">No confirmed rides</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Rides confirmed by passengers will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRides.map((ride) => (
                    <BookingCard
                      key={ride.id}
                      booking={ride}
                      userType="driver"
                      onMessage={(booking) => {
                        setSelectedBookingForMessaging(booking);
                        if (booking.passenger_id) {
                          supabase
                            .from('passengers')
                            .select('*')
                            .eq('id', booking.passenger_id)
                            .maybeSingle()
                            .then(({ data: passenger, error }) => {
                              if (passenger && !error) {
                                setPassengerProfile(passenger);
                              }
                            });
                        }
                        setMessagingOpen(true);
                      }}
                      onViewSummary={(booking) => handleViewSummary(booking)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Past Rides Tab */}
            {rideView === "past-rides" && (
              <div className="space-y-3">
                {/* Header */}
                <div className="text-center py-4">
                  <h2 className="text-2xl font-bold text-foreground mb-2">📋 Past Rides</h2>
                  <p className="text-sm text-muted-foreground">
                    Completed rides ({filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''})
                  </p>
                </div>

                {filteredRides.length === 0 ? (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                        <Car className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">No completed rides</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Your completed rides will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRides.map((ride) => (
                    <BookingCard
                      key={ride.id}
                      booking={ride}
                      userType="driver"
                      onMessage={(booking) => {
                        setSelectedBookingForMessaging(booking);
                        if (booking.passenger_id) {
                          supabase
                            .from('passengers')
                            .select('*')
                            .eq('id', booking.passenger_id)
                            .maybeSingle()
                            .then(({ data: passenger, error }) => {
                              if (passenger && !error) {
                                setPassengerProfile(passenger);
                              }
                            });
                        }
                        setMessagingOpen(true);
                      }}
                      onViewSummary={(booking) => handleViewSummary(booking)}
                      onReview={(booking) => {
                        // Handle review functionality for completed rides
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "earnings" && (
          <EarningsSection driverId={userProfile?.id} />
        )}

        {activeTab === "messages" && (
          <MessagesTab 
            userId={userProfile?.id} 
            userType="driver"
            userName={userProfile?.full_name}
          />
        )}

        {activeTab === "settings" && (
          <DriverSettingsModal
            isOpen={true}
            onClose={() => setActiveTab("rides")}
            profile={userProfile}
            onPhotoUpload={handlePhotoUpload}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="driver"
      />

      {/* Messaging Modal */}
      {messagingOpen && selectedBookingForMessaging && (
        <MessagingInterface
          isOpen={messagingOpen}
          onClose={() => setMessagingOpen(false)}
          bookingId={selectedBookingForMessaging.id}
          userId={userProfile?.id}
          userType="driver"
          userName={userProfile?.full_name}
          otherUserName={passengerProfile?.full_name || selectedBookingForMessaging.passenger}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
