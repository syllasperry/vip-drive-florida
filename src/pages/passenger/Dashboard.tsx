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
import { User, LogOut, Clock, MessageCircle, CreditCard, Settings, Car, CalendarDays, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Handle tab navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'bookings':
        // Already on bookings page
        break;
      case 'messages':
        setMessagingOpen(true);
        break;
      case 'payments':
        setSettingsType('notifications');
        setSettingsModalOpen(true);
        break;
      case 'settings':
        setSettingsType('privacy');
        setSettingsModalOpen(true);
        break;
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
          payment_status: booking.payment_status
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
            console.log('Booking update received:', payload);
            fetchBookings(); // Refresh bookings when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userProfile]);

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date + ' ' + booking.time);
    const now = new Date();
    
    if (bookingView === "upcoming") {
      return ['pending', 'accepted', 'confirmed', 'price_proposed', 'payment_confirmed', 'ready_to_go'].includes(booking.status) ||
             (bookingDate >= now && !['completed', 'cancelled', 'declined', 'rejected_by_passenger'].includes(booking.status));
    } else {
      return ['completed', 'cancelled', 'declined', 'rejected_by_passenger'].includes(booking.status) ||
             (bookingDate < now && !['pending', 'accepted', 'confirmed', 'price_proposed', 'payment_confirmed', 'ready_to_go'].includes(booking.status));
    }
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
    <div className="min-h-screen bg-background">
      {userProfile?.id && (
        <NotificationManager 
          userId={userProfile.id}
          userType="passenger"
        />
      )}
      
      {/* Main Container - Clean Mobile Layout inspired by Airbnb */}
      <div className="max-w-sm mx-auto min-h-screen flex flex-col">
        
        {/* Header Section */}
        <div className="p-4 bg-background">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setProfileEditOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-muted/50 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={userProfile?.profile_photo_url} 
                    alt={userProfile?.full_name || "Profile"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>

          {/* Clean Tab Navigation */}
          <div className="flex bg-muted/30 p-1 rounded-lg mb-4">
            <Button
              variant={bookingView === "upcoming" ? "default" : "ghost"}
              size="sm"
              className="flex-1 text-sm font-medium h-9 rounded-md"
              onClick={() => setBookingView("upcoming")}
            >
              Upcoming
            </Button>
            <Button
              variant={bookingView === "past" ? "default" : "ghost"}
              size="sm"
              className="flex-1 text-sm font-medium h-9 rounded-md"
              onClick={() => setBookingView("past")}
            >
              Past Rides
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-4 space-y-4">
          {/* Active Fare Confirmation Alert - Always at Top */}
          {pendingFareBooking && (
            <FareConfirmationAlert
              isVisible={true}
              fareAmount={pendingFareBooking.final_price || 0}
              onAccept={() => handleAcceptFare(pendingFareBooking.id)}
              onDecline={() => handleDeclineFare(pendingFareBooking.id)}
              onClose={() => setPendingFareBooking(null)}
              expiresAt={pendingFareBooking.payment_expires_at ? 
                new Date(pendingFareBooking.payment_expires_at) : 
                new Date(Date.now() + 15 * 60 * 1000)
              }
            />
          )}

          {/* Bookings List */}
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">
                  {bookingView === "upcoming" ? "🚗" : "📋"}
                </div>
                <p className="text-muted-foreground text-sm">
                  {bookingView === "upcoming" ? "No upcoming rides" : "No past rides"}
                </p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
                  <BookingCard
                    booking={booking}
                    userType="passenger"
                    onMessage={() => {
                      setSelectedBookingForMessaging(booking);
                      setMessagingOpen(true);
                    }}
                    onReview={() => {
                      setSelectedBookingForReview(booking.id);
                      setReviewModalOpen(true);
                    }}
                    onViewSummary={() => {
                      setSelectedBookingForSummary(booking);
                      setSummaryModalOpen(true);
                    }}
                    onCancelSuccess={() => {
                      fetchBookings();
                    }}
                  />
                </Card>
              ))
            )}
          </div>
        </div>

        {/* New Booking Button - Airbnb Style - Above Bottom Navigation */}
        <div className="p-4 pb-20">
          <Button 
            onClick={handleNewBooking}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
            size="lg"
          >
            <span className="text-xl mr-2">+</span>
            New Booking
          </Button>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userType="passenger"
        />
      </div>

      {/* Modals */}
      {selectedBookingForMessaging && (
        <MessagingInterface 
          isOpen={messagingOpen}
          onClose={() => {
            setMessagingOpen(false);
            setSelectedBookingForMessaging(null);
          }}
          bookingId={selectedBookingForMessaging.id}
          currentUserId={userProfile?.id || ""}
          currentUserName={userProfile?.full_name || ""}
          currentUserAvatar={userProfile?.profile_photo_url}
          otherUserName={selectedBookingForMessaging.driver}
          otherUserAvatar={selectedBookingForMessaging.drivers?.profile_photo_url}
          userType="passenger"
        />
      )}
      
      <SettingsModal 
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        type={settingsType}
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