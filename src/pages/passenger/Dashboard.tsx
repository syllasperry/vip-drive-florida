import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagingInterface } from "@/components/MessagingInterface";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import PassengerPreferencesModal from "@/components/PassengerPreferencesModal";
import OrganizedBookingsList from "@/components/dashboard/OrganizedBookingsList";
import CelebrationModal from "@/components/CelebrationModal";
import { ReviewModal } from "@/components/ReviewModal";
import { BookingSummaryModal } from "@/components/BookingSummaryModal";
import StatusTracker, { BookingStatus } from "@/components/StatusTracker";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { UpcomingRideCard } from "@/components/dashboard/UpcomingRideCard";
import { BookingToggle } from "@/components/dashboard/BookingToggle";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { FareConfirmationAlert } from "@/components/FareConfirmationAlert";
import { PaymentConfirmationModal } from "@/components/PaymentConfirmationModal";
import { NotificationManager } from "@/components/NotificationManager";
import { ChatNotificationBadge } from "@/components/ChatNotificationBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Clock, MessageCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingView, setBookingView] = useState<"upcoming" | "past">("upcoming");
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"notifications" | "privacy">("notifications");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedBookingForSummary, setSelectedBookingForSummary] = useState<any>(null);
  const [selectedBookingForMessaging, setSelectedBookingForMessaging] = useState<any>(null);
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const [showRideConfirmation, setShowRideConfirmation] = useState(false);
  const [pendingFareBooking, setPendingFareBooking] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

  const handleAcceptFare = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'payment_confirmed',
          payment_status: 'pending_payment'
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error accepting fare:', error);
        toast({
          title: "Error",
          description: "Failed to accept fare",
          variant: "destructive",
        });
        return;
      }

      // Send confirmation message
      await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: userProfile?.id,
          sender_type: 'passenger',
          message_text: `I've accepted the fare of $${pendingFareBooking?.final_price?.toFixed(2)}. Proceeding with payment.`
        });

      // Send notification
      await supabase.functions.invoke('send-booking-notifications', {
        body: {
          bookingId: bookingId,
          status: 'payment_confirmed',
          triggerType: 'status_change'
        }
      });

      setPendingFareBooking(null);
      fetchBookings();

      toast({
        title: "Fare Accepted!",
        description: "Please proceed with payment.",
      });

      // Open payment modal
      setSelectedBookingForPayment(pendingFareBooking);
      setPaymentModalOpen(true);
    } catch (error) {
      console.error('Error accepting fare:', error);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!selectedBookingForPayment) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: 'passenger_confirmed'
        })
        .eq('id', selectedBookingForPayment.id);

      if (error) {
        console.error('Error confirming payment:', error);
        toast({
          title: "Error",
          description: "Failed to confirm payment",
          variant: "destructive",
        });
        return;
      }

      // Send confirmation message
      await supabase
        .from('messages')
        .insert({
          booking_id: selectedBookingForPayment.id,
          sender_id: userProfile?.id,
          sender_type: 'passenger',
          message_text: `I've completed the payment of $${selectedBookingForPayment?.final_price?.toFixed(2)}. Please confirm receipt.`
        });

      // Send notification
      await supabase.functions.invoke('send-booking-notifications', {
        body: {
          bookingId: selectedBookingForPayment.id,
          status: 'payment_confirmed',
          triggerType: 'status_change'
        }
      });

      fetchBookings();
      toast({
        title: "Payment Confirmed!",
        description: "Waiting for driver confirmation.",
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handleDeclineFare = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'rejected_by_passenger'
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error declining fare:', error);
        toast({
          title: "Error",
          description: "Failed to decline fare",
          variant: "destructive",
        });
        return;
      }

      // Send decline message
      await supabase
        .from('messages')
        .insert({
          booking_id: bookingId,
          sender_id: userProfile?.id,
          sender_type: 'passenger',
          message_text: `I've declined the proposed fare of $${pendingFareBooking?.final_price?.toFixed(2)}. Please contact me to discuss.`
        });

      // Send notification
      await supabase.functions.invoke('send-booking-notifications', {
        body: {
          bookingId: bookingId,
          status: 'rejected_by_passenger',
          triggerType: 'status_change'
        }
      });

      setPendingFareBooking(null);
      fetchBookings();

      toast({
        title: "Fare Declined",
        description: "The driver has been notified.",
      });
    } catch (error) {
      console.error('Error declining fare:', error);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "User profile not loaded",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image (JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show uploading state immediately
      const optimisticUrl = URL.createObjectURL(file);
      const previousUrl = userProfile.profile_photo_url;
      
      setUserProfile((prev: any) => ({
        ...prev,
        profile_photo_url: optimisticUrl,
      }));

      const fileExt = file.name.split(".").pop();
      const fileName = `${userProfile.id}.${fileExt}`;
      const filePath = `${userProfile.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: publicURLData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicURL = publicURLData?.publicUrl;
      if (!publicURL) {
        throw new Error("Failed to get public URL");
      }

      // Update database
      const { error: updateError } = await supabase
        .from("passengers")
        .update({ profile_photo_url: publicURL })
        .eq("id", userProfile.id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Update state with final URL
      setUserProfile((prev: any) => ({
        ...prev,
        profile_photo_url: publicURL,
      }));

      // Clean up old URL if it exists and is a blob
      if (previousUrl && previousUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previousUrl);
      }

      toast({
        title: "Photo updated!",
        description: "Your profile photo has been successfully uploaded.",
      });

    } catch (error) {
      console.error("Photo upload error:", error);
      
      // Revert optimistic update on error
      setUserProfile((prev: any) => ({
        ...prev,
        profile_photo_url: userProfile.profile_photo_url,
      }));

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile photo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate("/passenger/login");
          return;
        }

        setIsAuthenticated(true);

        const { data: passenger, error } = await supabase
          .from("passengers")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        } else {
          setUserProfile(passenger);
          // Debug log as requested
          console.log(passenger);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/passenger/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/passenger/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleNewBooking = () => {
    navigate("/passenger/price-estimate");
  };

  const handleLogout = async () => {
    try {
      // Clear all auth state first
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });

      // Sign out with global scope
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force complete page reload to clear all state
      window.location.href = "/passenger/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force reload even on error
      window.location.href = "/passenger/login";
    }
  };

  useEffect(() => {
    const isNewAccount = localStorage.getItem("show_welcome_celebration");
    if (isNewAccount === "true") {
      setShowWelcomeCelebration(true);
      localStorage.removeItem("show_welcome_celebration");
    }
  }, []);

  useEffect(() => {
    const rideConfirmed = localStorage.getItem("ride_confirmed");
    if (rideConfirmed === "true") {
      setShowRideConfirmation(true);
      localStorage.removeItem("ride_confirmed");
    }
  }, []);

  const [bookings, setBookings] = useState<any[]>([]);

  // Fetch real bookings from Supabase
  const fetchBookings = async () => {
    if (!userProfile?.id) return;

    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          drivers:driver_id (
            id,
            full_name,
            phone,
            email,
            profile_photo_url
          ),
          vehicles:vehicle_id (
            id,
            type,
            description,
            image_url
          )
        `)
        .eq('passenger_id', userProfile.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
        return;
      }

      // Transform Supabase data to match expected format
      const transformedBookings = bookingsData.map(booking => {
        const pickupDate = new Date(booking.pickup_time);
        return {
          id: booking.id,
          date: pickupDate.toISOString().split('T')[0], // YYYY-MM-DD format
          time: pickupDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          from: booking.pickup_location,
          to: booking.dropoff_location,
          vehicle: "Standard Vehicle",
          vehicleModel: booking.vehicles?.type || "Tesla Model Y",
          status: booking.status,
          driver: booking.drivers?.full_name || null,
          drivers: booking.drivers, // Include full driver data for avatar
          paymentMethod: booking.payment_status === 'completed' ? 'Paid' : 'Pending',
          countdown: null,
          flight_info: booking.flight_info,
          passenger_count: booking.passenger_count,
          luggage_count: booking.luggage_count,
          final_price: booking.final_price,
          payment_expires_at: booking.payment_expires_at,
          payment_status: booking.payment_status,
          updated_at: booking.updated_at // Include updated_at for proper sorting
        };
      });

      setBookings(transformedBookings);
      
      // Check for pending fare confirmation
      const pendingBooking = transformedBookings.find(booking => booking.status === 'price_proposed');
      setPendingFareBooking(pendingBooking || null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription for booking status updates
    if (userProfile?.id) {
      const channel = supabase
        .channel('passenger-booking-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings',
            filter: `passenger_id=eq.${userProfile.id}`
          },
          (payload) => {
            console.log('Booking status updated:', payload);
            fetchBookings(); // Refresh bookings when status changes
            
            // Show toast notification for status changes
            if (payload.new.status !== payload.old?.status) {
              const statusMessages = {
                'accepted': 'Your ride has been accepted!',
                'declined': 'Your ride was declined.',
                'cancelled': 'Your ride has been cancelled.',
                'completed': 'Your ride is complete!'
              };
              
              const message = statusMessages[payload.new.status as keyof typeof statusMessages];
              if (message) {
                toast({
                  title: "Booking Update",
                  description: message,
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile?.id, toast]);

  // Filter bookings based on current view
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingView === "upcoming") {
      return bookingDate >= today && booking.status !== "completed";
    } else {
      return bookingDate < today || booking.status === "completed";
    }
  });

  // Get next upcoming ride
  const nextRide = bookings.find(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate >= today && (booking.status === "confirmed" || booking.status === "payment_confirmed");
  });


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
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <ProfileHeader 
          userProfile={userProfile}
          onPhotoUpload={handlePhotoUpload}
          userType="passenger"
        />

        {/* Status Tracker for most recent booking */}
        {bookings.length > 0 && activeTab === "bookings" && bookingView === "upcoming" && (
          <StatusTracker 
            status={bookings[0]?.status as BookingStatus}
            className="mb-4"
          />
        )}

        {/* Next Upcoming Ride Card */}
        {nextRide && activeTab === "bookings" && (
          <UpcomingRideCard 
            ride={nextRide}
            userType="passenger"
                     onMessage={() => {
                       setSelectedBookingForMessaging(nextRide);
                       setMessagingOpen(true);
                     }}
          />
        )}

        {/* Fare Confirmation Alert */}
        {pendingFareBooking && (
          <FareConfirmationAlert 
            isVisible={true}
            fareAmount={pendingFareBooking.final_price || 0}
            onAccept={() => handleAcceptFare(pendingFareBooking.id)}
            onDecline={() => handleDeclineFare(pendingFareBooking.id)}
            expiresAt={new Date(pendingFareBooking.payment_expires_at)}
          />
        )}

        {/* Payment Status Cards for confirmed bookings - Only show on Bookings tab */}
        {activeTab === "bookings" && bookingView === "upcoming" && 
          bookings
            .filter(booking => 
              booking.status === 'payment_confirmed' || 
              booking.status === 'ready_to_go' ||
              (booking.status === 'accepted' && booking.final_price)
            )
            .map((booking) => (
              <Card key={booking.id} className="bg-gradient-to-br from-success/5 to-success-glow/5 border-success/20 shadow-[var(--shadow-luxury)] mb-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {booking.date} at {booking.time}
                        </p>
                      </div>
                    </div>
                    <Badge className={
                      booking.status === 'ready_to_go' 
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    }>
                      {booking.status === 'ready_to_go' ? 'Ready to Go!' : 'Payment Confirmed'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={booking.drivers?.profile_photo_url || ""} alt={booking.driver || 'Driver'} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Driver: {booking.driver || 'Unknown Driver'}
                      </p>
                      <p className="text-xl font-bold text-foreground">${booking.final_price?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                    <h4 className="text-success font-semibold mb-2">Payment Status</h4>
                    <p className="text-sm text-success">
                      {booking.status === 'ready_to_go' 
                        ? "Payment confirmed by both parties."
                        : "Payment confirmation in progress."
                      }
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <p><strong>From:</strong> {booking.from}</p>
                    <p><strong>To:</strong> {booking.to}</p>
                  </div>

                  <div className="flex gap-2">
                    {booking.status !== 'ready_to_go' && (
                      <Button
                        onClick={() => {
                          setSelectedBookingForPayment(booking);
                          setPaymentModalOpen(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-success to-success-glow text-white"
                      >
                        View Payment
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setSelectedBookingForMessaging(booking);
                        setMessagingOpen(true);
                      }}
                      variant="outline"
                      className="flex-1 flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        }

        {/* Notification Manager */}
        {userProfile?.id && (
          <NotificationManager 
            userId={userProfile.id}
            userType="passenger"
          />
        )}

        {/* Tab Content */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Booking View Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                onClick={() => setBookingView("upcoming")}
                variant={bookingView === "upcoming" ? "default" : "ghost"}
                className="flex-1 h-9"
              >
                Upcoming
              </Button>
              <Button
                onClick={() => setBookingView("past")}
                variant={bookingView === "past" ? "default" : "ghost"}
                className="flex-1 h-9"
              >
                Past Rides
              </Button>
            </div>
            
            <OrganizedBookingsList
              bookings={bookingView === "upcoming" 
                ? bookings.filter(booking => 
                    !['completed', 'cancelled', 'declined', 'rejected_by_passenger'].includes(booking.status)
                  )
                : bookings.filter(booking => 
                    ['completed', 'cancelled', 'declined', 'rejected_by_passenger'].includes(booking.status)
                  )
              }
              userType="passenger"
              onMessage={(booking) => {
                setSelectedBookingForMessaging(booking);
                setMessagingOpen(true);
              }}
              onReview={(bookingId) => {
                setSelectedBookingForReview(bookingId);
                setReviewModalOpen(true);
              }}
              onViewSummary={(booking) => {
                setSelectedBookingForSummary(booking);
                setSummaryModalOpen(true);
              }}
              onCancelSuccess={() => {
                fetchBookings(); // Refresh bookings after cancellation
              }}
            />
          </div>
        )}

        {activeTab === "messages" && (
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.filter(booking => booking.drivers && booking.status !== 'completed' && booking.status !== 'cancelled').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active conversations.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings
                      .filter(booking => booking.drivers && booking.status !== 'completed' && booking.status !== 'cancelled')
                      .map((booking) => (
                        <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                          setSelectedBookingForMessaging(booking);
                          setMessagingOpen(true);
                        }}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={booking.drivers?.profile_photo_url || ""} alt={booking.driver || 'Driver'} />
                                <AvatarFallback>
                                  <User className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{booking.driver}</p>
                                <p className="text-sm text-muted-foreground">Active booking conversation</p>
                              </div>
                              <MessageCircle className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.filter(booking => booking.payment_status === 'completed' || booking.status === 'ready_to_go').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No payment history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings
                      .filter(booking => booking.payment_status === 'completed' || booking.status === 'ready_to_go')
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((booking) => (
                        <Card key={booking.id} className="border-success/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-success/10 rounded-full">
                                  <CreditCard className="h-4 w-4 text-success" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">Payment Completed</p>
                                  <p className="text-sm text-muted-foreground">{booking.date} at {booking.time}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-foreground">${booking.final_price?.toFixed(2)}</p>
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                  Paid
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={booking.drivers?.profile_photo_url || ""} alt={booking.driver || 'Driver'} />
                                <AvatarFallback>
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-muted-foreground">Driver: {booking.driver}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>{booking.from} → {booking.to}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow" onClick={() => setProfileEditOpen(true)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Edit Profile</h3>
                    <p className="text-sm text-muted-foreground">Update your personal information</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow" onClick={() => setPreferencesModalOpen(true)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Ride Preferences</h3>
                    <p className="text-sm text-muted-foreground">Set your ride preferences for drivers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow" onClick={() => {
              setSettingsType("notifications");
              setSettingsModalOpen(true);
            }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow border-destructive/20" onClick={handleLogout}>
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

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleNewBooking} />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="passenger"
      />

      {/* Modals */}
       <MessagingInterface 
         isOpen={messagingOpen} 
         onClose={() => {
           setMessagingOpen(false);
           setSelectedBookingForMessaging(null);
         }}
         userType="passenger"
         bookingId={selectedBookingForMessaging?.id || ""}
         currentUserId={userProfile?.id || ""}
         currentUserName={userProfile?.full_name || ""}
         currentUserAvatar={userProfile?.profile_photo_url}
         otherUserName={selectedBookingForMessaging?.driver}
         otherUserAvatar=""
       />
      
      <SettingsModal 
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        type={settingsType}
        userId={userProfile?.id}
        userType="passenger"
      />
      
      <ProfileEditModal 
        isOpen={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
        userProfile={userProfile}
        onPhotoUpload={handlePhotoUpload}
      />

      <ReviewModal 
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        bookingId={selectedBookingForReview}
      />

      <BookingSummaryModal 
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        booking={selectedBookingForSummary || {}}
      />

      <CelebrationModal 
        isOpen={showWelcomeCelebration}
        onClose={() => setShowWelcomeCelebration(false)}
      />

       <CelebrationModal 
         isOpen={showRideConfirmation}
         onClose={() => setShowRideConfirmation(false)}
       />

       {/* Payment Confirmation Modal */}
       {selectedBookingForPayment && (
         <PaymentConfirmationModal
           isOpen={paymentModalOpen}
           onClose={() => {
             setPaymentModalOpen(false);
             setSelectedBookingForPayment(null);
           }}
           bookingData={selectedBookingForPayment}
           userType="passenger"
           onConfirmPayment={handlePaymentConfirmation}
           paymentStatus={selectedBookingForPayment.payment_status || 'pending'}
         />
        )}

         {/* Passenger Preferences Modal */}
         <PassengerPreferencesModal
           isOpen={preferencesModalOpen}
           onClose={() => setPreferencesModalOpen(false)}
           userProfile={userProfile}
           onUpdate={() => {
             // Refresh user profile to reflect changes
             if (userProfile?.id) {
               supabase
                 .from('passengers')
                 .select('*')
                 .eq('id', userProfile.id)
                 .single()
                 .then(({ data }) => {
                   if (data) {
                     setUserProfile(data);
                   }
                 });
             }
           }}
         />
     </div>
   );
 };

 export default Dashboard;