import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessagingInterface } from "@/components/MessagingInterface";
import { PriceEditModal } from "@/components/PriceEditModal";
import { DriverScheduleModal } from "@/components/DriverScheduleModal";
import { DriverSettingsModal } from "@/components/DriverSettingsModal";
import { DriverPreferencesModal } from "@/components/DriverPreferencesModal";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { UpcomingRideCard } from "@/components/dashboard/UpcomingRideCard";
import { BookingToggle } from "@/components/dashboard/BookingToggle";
import { BookingCard } from "@/components/dashboard/BookingCard";
import PendingRequestAlert from "@/components/dashboard/PendingRequestAlert";
import StatusTracker, { BookingStatus } from "@/components/StatusTracker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car, DollarSign, User, LogOut, Clock, CheckCircle, Calendar, MessageCircle, Edit } from "lucide-react";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State declarations
  const [activeTab, setActiveTab] = useState("rides");
  const [rideView, setRideView] = useState<"upcoming" | "past">("upcoming");
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"notifications" | "privacy" | null>(null);
  const [driverPreferencesModalOpen, setDriverPreferencesModalOpen] = useState(false);
  const [selectedBookingForMessaging, setSelectedBookingForMessaging] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [passengerProfile, setPassengerProfile] = useState<any>(null);
  const [priceEditModal, setPriceEditModal] = useState<{ isOpen: boolean; booking: any }>({ isOpen: false, booking: null });
  
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
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate("/driver/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/driver/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handlePhotoUpload = async (file: File): Promise<void> => {
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
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
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
      // Update booking with driver_id and status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'accepted',
          driver_id: userProfile.id
        })
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

  const handleConfirmPaymentReceived = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'completed', status: 'payment_confirmed' })
        .eq('id', rideId);

      if (error) {
        console.error('Error confirming payment:', error);
        toast({
          title: "Error",
          description: "Failed to confirm payment",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setDriverRides(prevRides => 
        prevRides.map(ride => 
          ride.id === rideId 
            ? { ...ride, status: "payment_confirmed", paymentMethod: "Completed" }
            : ride
        )
      );

      toast({
        title: "Payment Confirmed!",
        description: "The booking is now confirmed.",
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handlePriceUpdate = async (bookingId: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          final_price: newPrice,
          status: 'price_proposed',
          payment_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating price:', error);
        toast({
          title: "Error",
          description: "Failed to update price",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setDriverRides(prevRides => 
        prevRides.map(ride => 
          ride.id === bookingId 
            ? { ...ride, payment: `$${newPrice.toFixed(2)}`, status: "price_proposed" }
            : ride
        )
      );

      toast({
        title: "Price Updated!",
        description: "The passenger will be notified of the new price.",
      });
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const [driverRides, setDriverRides] = useState<any[]>([]);

  // Fetch real bookings for the driver
  useEffect(() => {
    const fetchDriverBookings = async () => {
      if (!userProfile?.id) return;

      try {
        // Fetch both assigned bookings AND pending bookings that match driver's vehicle
        const [assignedBookings, pendingBookings] = await Promise.all([
          // Get bookings already assigned to this driver
          supabase
            .from('bookings')
            .select(`
              *,
              passengers:passenger_id (
                id,
                full_name,
                phone,
                email
              ),
              vehicles:vehicle_id (
                id,
                type,
                description
              )
            `)
            .eq('driver_id', userProfile.id)
            .order('pickup_time', { ascending: true }),
          
          // Get pending bookings that match this driver's vehicle type
          supabase
            .from('bookings')
            .select(`
              *,
              passengers:passenger_id (
                id,
                full_name,
                phone,
                email
              ),
              vehicles:vehicle_id (
                id,
                type,
                description
              )
            `)
            .eq('status', 'pending')
            .is('driver_id', null)
            .or(`vehicle_type.ilike.%${userProfile.car_make} ${userProfile.car_model}%,vehicle_type.is.null`)
            .order('pickup_time', { ascending: true })
        ]);

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
            status: booking.status,
            payment: "$120.00", // TODO: Calculate real price
            paymentMethod: booking.payment_status === 'completed' ? 'Completed' : null,
            countdown: null,
            flight_info: booking.flight_info,
            passenger_count: booking.passenger_count,
            luggage_count: booking.luggage_count,
            vehicle_type: booking.vehicle_type || 'Vehicle'
          };
        });

        setDriverRides(transformedBookings);
      } catch (error) {
        console.error('Error fetching driver bookings:', error);
      }
    };

    fetchDriverBookings();

        // Set up real-time subscription for new bookings assigned to this driver
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
              // Check if this booking is for the current driver
              if (payload.new.driver_id === userProfile?.id) {
                console.log('New booking assigned to driver:', payload);
                fetchDriverBookings();
                
                // Show visual and audio notification
                toast({
                  title: "🚨 NEW RIDE REQUEST!",
                  description: `New ${payload.new.vehicle_type} booking request received!`,
                  variant: "default",
                });

                // Play notification sound (if supported)
                try {
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCE');
                  audio.play();
                } catch (e) {
                  console.log('Audio notification not supported');
                }
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

  // Get next upcoming ride
  const nextRide = driverRides.find(ride => {
    const rideDate = new Date(ride.date);
    const today = new Date();
    return rideDate >= today && (ride.status === "confirmed" || ride.status === "payment_confirmed");
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/10 text-success border-success/20";
      case "pending": return "bg-warning/10 text-warning border-warning/20";
      case "waiting_payment": return "bg-orange-100/80 text-orange-800 border-orange-200";
      case "payment_confirmed": return "bg-success/10 text-success border-success/20";
      case "completed": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-muted/10 text-muted-foreground border-border";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmed";
      case "pending": return "Pending";
      case "waiting_payment": return "Awaiting Payment";
      case "payment_confirmed": return "Payment Confirmed";
      case "completed": return "Completed";
      default: return status;
    }
  };

  // Show loading while checking authentication
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

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <ProfileHeader 
          userProfile={userProfile}
          onPhotoUpload={handlePhotoUpload}
          userType="driver"
          isOnline={isOnline}
          onProfileUpdate={() => {
            // Refresh driver profile after update
            const refreshProfile = async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const { data: driver } = await supabase
                  .from('drivers')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();
                if (driver) {
                  setUserProfile(driver);
                }
              }
            };
            refreshProfile();
          }}
        />

        {/* Next Upcoming Ride Card */}
        {nextRide && activeTab === "rides" && (
          <UpcomingRideCard 
            ride={nextRide}
            userType="driver"
            onMessage={async () => {
              setSelectedBookingForMessaging(nextRide);
              // Fetch passenger profile
              if (nextRide.passenger_id) {
                try {
                  const { data: passenger, error } = await supabase
                    .from('passengers')
                    .select('*')
                    .eq('id', nextRide.passenger_id)
                    .maybeSingle();
                    
                  if (passenger && !error) {
                    setPassengerProfile(passenger);
                  }
                } catch (error) {
                  console.error('Error fetching passenger profile:', error);
                }
              }
              setMessagingOpen(true);
            }}
            onStartRide={() => {
              toast({
                title: "Starting ride...",
                description: "Navigation will begin shortly.",
              });
            }}
            onNavigate={() => {
              toast({
                title: "Opening navigation",
                description: "Redirecting to maps...",
              });
            }}
          />
        )}

        {/* Pending Requests Alert */}
        {activeTab === "rides" && (
          <PendingRequestAlert 
            requests={driverRides.filter(ride => ride.status === "pending").map(ride => ({
              id: ride.id,
              passenger: ride.passenger,
              from: ride.from,
              to: ride.to,
              time: ride.time,
              date: ride.date,
              vehicle_type: ride.vehicle_type,
              passenger_count: ride.passenger_count,
              luggage_count: ride.luggage_count,
              flight_info: ride.flight_info
            }))}
            onAccept={handleAcceptRide}
            onDecline={handleDeclineRide}
          />
        )}

        {/* Tab Content */}
        {activeTab === "rides" && (
          <div>
            <BookingToggle 
              activeView={rideView}
              onViewChange={setRideView}
            />
            
            <div className="space-y-4">
              {filteredRides.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {rideView === "upcoming" ? "No upcoming rides" : "No past rides"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredRides.map((ride) => (
                  <Card key={ride.id} className={`hover:shadow-[var(--shadow-subtle)] transition-all duration-300 border-border/50 ${
                    ride.status === "pending" ? "ring-2 ring-warning/50 animate-pulse" : ""
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {ride.date} at {ride.time}
                            </p>
                            {ride.countdown && (
                              <p className="text-xs text-orange-600 font-medium">
                                {ride.countdown}h remaining
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ride.status === "pending" && (
                            <Badge className="bg-warning/20 text-warning border-warning/30 animate-pulse">
                              🆕 New Request
                            </Badge>
                          )}
                          <Badge className={getStatusColor(ride.status)}>
                            {getStatusText(ride.status)}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">{ride.passenger}</span>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <p className="text-lg font-semibold text-primary">{ride.payment}</p>
                            {(ride.status === "pending" || ride.status === "accepted") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPriceEditModal({ isOpen: true, booking: ride })}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                title="Click here if you want to customize the ride price"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-foreground space-y-1">
                          <p><span className="text-muted-foreground">From:</span> {ride.from}</p>
                          <p><span className="text-muted-foreground">To:</span> {ride.to}</p>
                          {ride.paymentMethod && (
                            <p><span className="text-muted-foreground">Payment:</span> {ride.paymentMethod}</p>
                          )}
                        </div>
                      </div>

                      {ride.status === "pending" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptRide(ride.id)}
                            className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeclineRide(ride.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {ride.status === "waiting_payment" && (
                        <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-200/50">
                          <p className="text-sm text-orange-800 mb-2">
                            Passenger needs to complete payment within 24 hours.
                          </p>
                          <Button 
                            size="sm" 
                            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow"
                            onClick={() => handleConfirmPaymentReceived(ride.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Confirm Payment Received</span>
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={async () => {
                            setSelectedBookingForMessaging(ride);
                            // Fetch passenger profile
                            if (ride.passenger_id) {
                              try {
                                const { data: passenger, error } = await supabase
                                  .from('passengers')
                                  .select('*')
                                  .eq('id', ride.passenger_id)
                                  .maybeSingle();
                                  
                                if (passenger && !error) {
                                  setPassengerProfile(passenger);
                                }
                              } catch (error) {
                                console.error('Error fetching passenger profile:', error);
                              }
                            }
                            setMessagingOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-sm text-muted-foreground mb-2">Today's Earnings</h3>
                  <p className="text-3xl font-bold text-primary">$180.00</p>
                  <p className="text-xs text-muted-foreground mt-1">+15% from yesterday</p>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm text-muted-foreground">This Week</h3>
                    <p className="text-2xl font-bold text-foreground">$950.00</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm text-muted-foreground">This Month</h3>
                    <p className="text-2xl font-bold text-foreground">$3,750.00</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow"
                 onClick={async () => {
                   // For demo purposes, using first ride if available
                   const firstRide = driverRides[0];
                   if (firstRide) {
                     setSelectedBookingForMessaging(firstRide);
                     // Fetch passenger profile
                     if (firstRide.passenger_id) {
                       try {
                         const { data: passenger, error } = await supabase
                           .from('passengers')
                           .select('*')
                           .eq('id', firstRide.passenger_id)
                           .maybeSingle();
                           
                         if (passenger && !error) {
                           setPassengerProfile(passenger);
                         }
                       } catch (error) {
                         console.error('Error fetching passenger profile:', error);
                       }
                     }
                     setMessagingOpen(true);
                   }
                 }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">SJ</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Sarah Johnson</h3>
                    <p className="text-sm text-muted-foreground">Could you please confirm your payment details?</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2:30 PM</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow"
                 onClick={async () => {
                   // For demo purposes, using second ride if available
                   const secondRide = driverRides[1];
                   if (secondRide) {
                     setSelectedBookingForMessaging(secondRide);
                     // Fetch passenger profile
                     if (secondRide.passenger_id) {
                       try {
                         const { data: passenger, error } = await supabase
                           .from('passengers')
                           .select('*')
                           .eq('id', secondRide.passenger_id)
                           .maybeSingle();
                           
                         if (passenger && !error) {
                           setPassengerProfile(passenger);
                         }
                       } catch (error) {
                         console.error('Error fetching passenger profile:', error);
                       }
                     }
                     setMessagingOpen(true);
                   }
                 }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">MC</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Mike Chen</h3>
                    <p className="text-sm text-muted-foreground">Hi, I'm ready for pickup!</p>
                  </div>
                  <div className="text-xs text-muted-foreground">1:45 PM</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow" onClick={() => setScheduleOpen(true)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Schedule Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage your availability and working hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow" onClick={() => setDriverPreferencesModalOpen(true)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Driver Preferences</h3>
                    <p className="text-sm text-muted-foreground">Edit your personal and vehicle information</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow" onClick={handleLogout}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-full">
                    <LogOut className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-destructive">Sign Out</h3>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="driver"
      />

      {/* Modals */}
       <MessagingInterface 
         isOpen={messagingOpen} 
         onClose={() => {
           setMessagingOpen(false);
           setSelectedBookingForMessaging(null);
           setPassengerProfile(null);
         }}
         userType="driver"
         bookingId={selectedBookingForMessaging?.id || ""}
         currentUserId={userProfile?.id || ""}
         currentUserName={userProfile?.full_name || ""}
         currentUserAvatar={userProfile?.profile_photo_url}
         otherUserName={passengerProfile?.full_name || "Passenger"}
         otherUserAvatar={passengerProfile?.profile_photo_url}
       />
      
      <DriverScheduleModal 
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
      />
      
      <DriverSettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settingType={settingsType || "notifications"}
      />

      <DriverPreferencesModal
        isOpen={driverPreferencesModalOpen}
        onClose={() => setDriverPreferencesModalOpen(false)}
        userProfile={userProfile}
        onPhotoUpload={handlePhotoUpload}
        onProfileUpdate={() => {
          // Refresh driver profile after update
          const refreshProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              const { data: driver } = await supabase
                .from('drivers')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              if (driver) {
                setUserProfile(driver);
              }
            }
          };
          refreshProfile();
        }}
      />

      <PriceEditModal
        isOpen={priceEditModal.isOpen}
        onClose={() => setPriceEditModal({ isOpen: false, booking: null })}
        currentPrice={parseFloat(priceEditModal.booking?.payment?.replace('$', '') || '0')}
        onPriceUpdate={(newPrice) => {
          if (priceEditModal.booking) {
            handlePriceUpdate(priceEditModal.booking.id, newPrice);
          }
          setPriceEditModal({ isOpen: false, booking: null });
        }}
      />
    </div>
  );
};

export default DriverDashboard;