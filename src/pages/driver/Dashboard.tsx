import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessagingInterface } from "@/components/MessagingInterface";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car, DollarSign, User, LogOut, Clock, CheckCircle, Calendar, MessageCircle, Edit, CreditCard, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);
  const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(false);
  
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

  const handlePaymentConfirmation = async () => {
    if (!selectedBookingForPayment) return;

    try {
      const currentStatus = selectedBookingForPayment.payment_status;
      let newStatus;
      
      if (currentStatus === 'passenger_confirmed') {
        newStatus = 'both_confirmed';
      } else {
        newStatus = 'driver_confirmed';
      }

      const { error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: newStatus,
          status: newStatus === 'both_confirmed' ? 'ready_to_go' : 'payment_confirmed'
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
          sender_type: 'driver',
          message_text: `I've confirmed receiving the payment of $${selectedBookingForPayment?.final_price?.toFixed(2)}.${newStatus === 'both_confirmed' ? ' Ready to go!' : ' Waiting for passenger confirmation.'}`
        });

      // Send notification
      await supabase.functions.invoke('send-booking-notifications', {
        body: {
          bookingId: selectedBookingForPayment.id,
          status: newStatus === 'both_confirmed' ? 'ready_to_go' : 'payment_confirmed',
          triggerType: 'status_change'
        }
      });

      // Update local state
      setDriverRides(prevRides => 
        prevRides.map(ride => 
          ride.id === selectedBookingForPayment.id 
            ? { 
                ...ride, 
                status: newStatus === 'both_confirmed' ? 'ready_to_go' : 'payment_confirmed', 
                payment_status: newStatus,
                paymentMethod: newStatus === 'both_confirmed' ? 'Completed' : 'Confirming'
              }
            : ride
        )
      );

      toast({
        title: "Payment Confirmed!",
        description: newStatus === 'both_confirmed' ? "Both parties confirmed. Ready to go!" : "Waiting for passenger confirmation.",
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
          status: 'awaiting_driver_confirmation',
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
            ? { ...ride, payment: `$${newPrice.toFixed(2)}`, status: "awaiting_driver_confirmation", final_price: newPrice }
            : ride
        )
      );

      toast({
        title: "Price Updated!",
        description: "Click Accept to confirm the price change and notify the passenger.",
      });
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  const handleConfirmPrice = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'price_proposed'
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error confirming price:', error);
        toast({
          title: "Error",
          description: "Failed to confirm price",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setDriverRides(prevRides => 
        prevRides.map(ride => 
          ride.id === bookingId 
            ? { ...ride, status: "price_proposed" }
            : ride
        )
      );

      // Send automatic message to passenger
      const ride = driverRides.find(r => r.id === bookingId);
      if (ride && ride.final_price) {
        await supabase
          .from('messages')
          .insert({
            booking_id: bookingId,
            sender_id: userProfile?.id,
            sender_type: 'driver',
            message_text: `I've confirmed the ride price at $${ride.final_price.toFixed(2)}. Please confirm the payment to proceed with your booking.`
          });
      }

      toast({
        title: "Price Confirmed!",
        description: "The passenger will be notified to confirm payment.",
      });
    } catch (error) {
      console.error('Error confirming price:', error);
    }
  };

  const [driverRides, setDriverRides] = useState<any[]>([]);
  const [driverConversations, setDriverConversations] = useState<any[]>([]);

  // Fetch real conversations for the driver
  useEffect(() => {
    const fetchDriverConversations = async () => {
      if (!userProfile?.id) return;

      try {
        // Get all bookings for this driver that have messages
        const { data: conversations, error } = await supabase
          .from('messages')
          .select(`
            booking_id,
            created_at,
            message_text,
            bookings:booking_id (
              id,
              pickup_location,
              dropoff_location,
              pickup_time,
              passenger_id,
              passengers:passenger_id (
                id,
                full_name,
                profile_photo_url,
                phone,
                email
              )
            )
          `)
          .eq('bookings.driver_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching conversations:', error);
          return;
        }

        // Group messages by booking_id and get the latest message for each conversation
        const groupedConversations = conversations.reduce((acc: any, message: any) => {
          const bookingId = message.booking_id;
          if (!acc[bookingId] || new Date(message.created_at) > new Date(acc[bookingId].lastMessage.created_at)) {
            acc[bookingId] = {
              booking_id: bookingId,
              booking: message.bookings,
              passenger: message.bookings?.passengers,
              lastMessage: {
                message_text: message.message_text,
                created_at: message.created_at
              }
            };
          }
          return acc;
        }, {});

        setDriverConversations(Object.values(groupedConversations));
      } catch (error) {
        console.error('Error fetching driver conversations:', error);
      }
    };

    fetchDriverConversations();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('driver-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchDriverConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

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
               passengers:passenger_id!inner (
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
          
          // Get pending bookings that match this driver's vehicle type OR are assigned to this driver
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
            .eq('status', 'pending')
            .or(`and(driver_id.is.null,vehicle_type.eq.${userProfile.car_make} ${userProfile.car_model}),driver_id.eq.${userProfile.id}`)
            .order('pickup_time', { ascending: true })
        ]);

        if (assignedBookings.error) {
          console.error('Error fetching assigned bookings:', assignedBookings.error);
          return;
        }

        if (pendingBookings.error) {
          console.error('Error fetching pending bookings:', pendingBookings.error);
        } else {
          console.log('✅ Pending bookings found:', pendingBookings.data?.length || 0);
          console.log('📋 Pending bookings data:', pendingBookings.data);
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
            payment: booking.final_price ? `$${booking.final_price.toFixed(2)}` : "$120.00",
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
            onNavigate={(navApp: string) => {
              // Open navigation with pickup and dropoff locations
              const pickup = encodeURIComponent(nextRide.from);
              const dropoff = encodeURIComponent(nextRide.to);
              
              let url = '';
              switch (navApp) {
                case 'google':
                  url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
                  break;
                case 'apple':
                  url = `http://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=d`;
                  break;
                case 'waze':
                  url = `https://waze.com/ul?ll=${pickup}&navigate=yes&to=ll.${dropoff}`;
                  break;
                default:
                  url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
              }
              
              window.open(url, '_blank');
              
              toast({
                title: `Opening ${navApp === 'apple' ? 'Apple Maps' : navApp === 'waze' ? 'Waze' : 'Google Maps'}`,
                description: "Navigation opened in new tab.",
              });
            }}
          />
        )}

        {/* Notification Manager */}
        {userProfile?.id && (
          <NotificationManager 
            userId={userProfile.id}
            userType="driver"
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
          <OrganizedBookingsList
            bookings={driverRides}
            userType="driver"
            onMessage={(booking) => {
              setSelectedBookingForMessaging(booking);
              // Fetch passenger profile
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
            onNavigate={(booking) => {
              // Handle navigation with external apps
              const pickup = encodeURIComponent(booking.from);
              const dropoff = encodeURIComponent(booking.to);
              
              // For now, open Google Maps. Could be enhanced to show options
              const url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
              window.open(url, '_blank');
              
              toast({
                title: "Opening Google Maps",
                description: "Navigation opened in new tab.",
              });
            }}
            onFareUpdate={handlePriceUpdate}
          />
        )}

        {activeTab === "earnings" && (
          <EarningsSection driverId={userProfile?.id} />
        )}

        {activeTab === "messages" && (
          <div className="space-y-4">
            {driverConversations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-1">No Messages Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Your conversations with passengers will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              driverConversations.map((conversation) => (
                <Card 
                  key={conversation.booking_id} 
                  className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow"
                  onClick={() => {
                    setSelectedBookingForMessaging(conversation.booking);
                    setPassengerProfile(conversation.passenger);
                    setMessagingOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.passenger?.profile_photo_url} />
                        <AvatarFallback>
                          {conversation.passenger?.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {conversation.passenger?.full_name || 'Unknown Passenger'}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.message_text || 'No messages yet'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs text-muted-foreground">
                          {conversation.lastMessage?.created_at ? 
                            new Date(conversation.lastMessage.created_at).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            }) : ''
                          }
                        </div>
                        <ChatNotificationBadge 
                          bookingId={conversation.booking_id}
                          userId={userProfile?.id || ''}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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

            <Card className="cursor-pointer hover:shadow-[var(--shadow-subtle)] transition-shadow" onClick={() => setPaymentSettingsOpen(true)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Payment Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage accepted payment methods and policies</p>
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

      {/* Payment Confirmation Modal */}
      {selectedBookingForPayment && (
        <PaymentConfirmationModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedBookingForPayment(null);
          }}
          bookingData={selectedBookingForPayment}
          userType="driver"
          onConfirmPayment={handlePaymentConfirmation}
          paymentStatus={selectedBookingForPayment.payment_status || 'pending'}
        />
      )}

      {/* Driver Payment Settings Modal */}
      <DriverPaymentSettingsModal
        isOpen={paymentSettingsOpen}
        onClose={() => setPaymentSettingsOpen(false)}
        driverId={userProfile?.id || ''}
        currentData={{
          payment_methods_accepted: userProfile?.payment_methods_accepted,
          cancellation_policy: userProfile?.cancellation_policy,
          preferred_payment_method: userProfile?.preferred_payment_method,
          payment_instructions: userProfile?.payment_instructions
        }}
        onUpdate={() => {
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
    </div>
  );
};

export default DriverDashboard;