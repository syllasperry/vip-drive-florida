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
import ToDoList from "@/components/dashboard/ToDoList";

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
        }

        // Set up real-time subscription for payment confirmations
        if (driver) {
          const channel = supabase
            .channel('driver-payment-notifications')
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'bookings',
                filter: `driver_id=eq.${driver.id}`
              },
              (payload) => {
                console.log('Booking update for driver:', payload);
                
                // Check if passenger confirmed payment
                if (payload.new?.payment_confirmation_status === 'passenger_paid' && 
                    payload.old?.payment_confirmation_status !== 'passenger_paid') {
                  toast({
                    title: "🚨 Payment Confirmation Required!",
                    description: `Passenger confirmed payment for ride to ${payload.new.dropoff_location}. Please verify and confirm receipt.`,
                    duration: 10000,
                  });
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
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

  const handleAcceptRide = async (rideId: string, price?: number) => {
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

  const handlePaymentConfirmation = async () => {
    if (!selectedBookingForPayment) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'paid',
          payment_confirmation_status: 'all_set',
          driver_payment_confirmed_at: new Date().toISOString()
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

      toast({
        title: "Payment Confirmed!",
        description: "🎉 Ride confirmed and paid! Both parties have been notified.",
      });

      // Close the payment modal
      setPaymentModalOpen(false);
      setSelectedBookingForPayment(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  // Function to handle payment confirmation from booking cards
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

  const handleViewSummary = (booking: any) => {
    setSelectedBooking(booking);
    setShowSummaryModal(true);
  };

  const handlePDFAction = (action: 'download' | 'email') => {
    setPdfAction(action);
    setShowContributorModal(true);
  };

  const generateDriverReport = async (contributorInfo: { type: 'individual' | 'business'; name: string }) => {
    try {
      // Get all completed bookings for this driver with payment status 'all_set'
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers!inner(
            full_name,
            account_type,
            account_name
          )
        `)
        .eq('driver_id', userProfile?.id)
        .eq('payment_confirmation_status', 'all_set')
        .not('final_price', 'is', null)
        .order('pickup_time', { ascending: false });

      if (error) throw error;

      const records = (bookings || []).map(booking => {
        const passengerName = booking.passengers?.full_name || 'Unknown Passenger';
        const passengerDisplayName = booking.passengers?.account_type === 'business' 
          ? `${passengerName} (Business)` 
          : `${passengerName} (Individual)`;
        
        // Format payment method display
        let paymentMethodDisplay = booking.payment_method || 'Unknown';
        if (booking.payment_method === 'zelle') paymentMethodDisplay = 'Received via Zelle';
        else if (booking.payment_method === 'venmo') paymentMethodDisplay = 'Received via Venmo';
        else if (booking.payment_method === 'apple_pay') paymentMethodDisplay = 'Received via Apple Pay';
        else if (booking.payment_method === 'google_pay') paymentMethodDisplay = 'Received via Google Pay';
        else if (booking.payment_method === 'payment_link') paymentMethodDisplay = 'Received via Payment Link';
        else if (booking.payment_method === 'cash') paymentMethodDisplay = 'Received in Cash';
        else paymentMethodDisplay = `Received via ${booking.payment_method}`;

        return {
          id: booking.id,
          amount: booking.final_price || booking.estimated_price || 0,
          date: booking.pickup_time,
          paymentMethod: paymentMethodDisplay,
          counterpartyName: passengerDisplayName
        };
      });

      const pdfData = {
        title: 'Driver Earnings Summary',
        contributorInfo,
        records,
        userType: 'driver' as const
      };

      const doc = PDFGenerator.generate(pdfData);
      const filename = `driver-earnings-summary-${new Date().toISOString().split('T')[0]}.pdf`;

      if (pdfAction === 'email') {
        await PDFGenerator.shareByEmail(doc, filename);
      } else {
        doc.save(filename);
      }

      toast({
        title: "Earnings report generated!",
        description: `Report ${pdfAction === 'email' ? 'shared' : 'downloaded'} successfully.`,
      });
    } catch (error) {
      console.error('Error generating earnings report:', error);
      toast({
        title: "Error",
        description: 'Failed to generate earnings report',
        variant: "destructive",
      });
    }
  };

  const generateEarningsReport = async (contributorInfo: { type: 'individual' | 'business'; name: string }) => {
    try {
      // Fetch all completed bookings with payment status 'all_set'
      const { data: completedBookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers!inner(full_name)
        `)
        .eq('driver_id', userProfile?.id)
        .eq('payment_confirmation_status', 'all_set')
        .not('final_price', 'is', null)
        .order('pickup_time', { ascending: false });

      if (error) throw error;

      const records = (completedBookings || []).map(booking => ({
        id: booking.id,
        amount: booking.final_price || 0,
        date: booking.pickup_time,
        paymentMethod: booking.payment_method || 'Not specified',
        counterpartyName: booking.passengers?.full_name || 'Unknown Passenger'
      }));

      const pdfData = {
        title: 'Driver Earnings Summary',
        contributorInfo,
        records,
        userType: 'driver' as const
      };

      const doc = PDFGenerator.generate(pdfData);
      const filename = `driver-earnings-summary-${new Date().toISOString().split('T')[0]}.pdf`;

      if (pdfAction === 'email') {
        await PDFGenerator.shareByEmail(doc, filename);
      } else {
        doc.save(filename);
      }

      toast({
        title: "Success!",
        description: `Earnings report ${pdfAction === 'email' ? 'shared' : 'downloaded'} successfully!`,
      });
    } catch (error) {
      console.error('Error generating earnings report:', error);
      toast({
        title: "Error",
        description: "Failed to generate earnings report",
        variant: "destructive",
      });
    }
  };

  const [driverRides, setDriverRides] = useState<any[]>([]);

  // Fetch real bookings for the driver
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
              passengers (
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
              )
            `)
            .eq('driver_id', userProfile.id)
            .order('pickup_time', { ascending: true }),
          
          // Get pending bookings that match this driver's vehicle type
          supabase
            .from('bookings')
            .select(`
              *,
              passengers (
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
          if (!booking.vehicle_type || !userProfile.car_make) return true; // Show if no vehicle specified
          
          const requestedMake = booking.vehicle_type.split(' ')[0].toLowerCase();
          const driverMake = userProfile.car_make.toLowerCase();
          
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
              pickup_time: booking.pickup_time, // Keep original for sorting
              pickup_location: booking.pickup_location,
              dropoff_location: booking.dropoff_location,
              from: booking.pickup_location,
              to: booking.dropoff_location,
              passenger: booking.passengers?.full_name || 'Unknown Passenger',
              passengers: booking.passengers, // Include full passenger data for avatar
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
            // Sort by pickup time - most recent/urgent first
            const dateA = new Date(a.pickup_time);
            const dateB = new Date(b.pickup_time);
            return dateA.getTime() - dateB.getTime();
          });

        console.log('=== DEBUG DRIVER BOOKINGS ===');
        console.log('Driver profile car info:', userProfile.car_make, userProfile.car_model);
        console.log('Raw assigned bookings:', assignedBookings.data);
        console.log('Raw pending bookings before filter:', pendingBookings.data);
        console.log('Filtered pending bookings after make matching:', filteredPendingBookings);
        console.log('Final transformed bookings:', transformedBookings);
        console.log('Bookings with All Set status:', transformedBookings.filter(b => b.payment_confirmation_status === 'all_set'));
        console.log('Bookings with completed status:', transformedBookings.filter(b => b.status === 'completed'));
        console.log('Passenger data check:', transformedBookings.map(b => ({ id: b.id, passenger: b.passenger, passengers: b.passengers })));
        console.log('Pending bookings error:', pendingBookings.error);
        console.log('Assigned bookings error:', assignedBookings.error);
        
        setDriverRides(transformedBookings);
        
        // Filter bookings for different views
        const now = new Date();
        
        const upcomingBookings = transformedBookings.filter(booking => {
          const bookingDate = new Date(booking.pickup_time);
          return bookingDate > now && (
            booking.status === 'accepted' || 
            booking.status === 'confirmed' ||
            booking.payment_confirmation_status === 'passenger_paid'
          );
        });

        const todoBookings = transformedBookings.filter(booking => {
          const bookingDate = new Date(booking.pickup_time);
          const oneHourAfterPickup = new Date(bookingDate.getTime() + 60 * 60 * 1000);
          return booking.payment_confirmation_status === 'all_set' && now < oneHourAfterPickup;
        });

        const pastBookings = transformedBookings.filter(booking => {
          const bookingDate = new Date(booking.pickup_time);
          const oneHourAfterPickup = new Date(bookingDate.getTime() + 60 * 60 * 1000);
          
          return booking.status === 'completed' || 
                 booking.status === 'cancelled' || 
                 booking.status === 'declined' ||
                 (booking.payment_confirmation_status === 'all_set' && now >= oneHourAfterPickup) ||
                 (bookingDate <= now && booking.payment_confirmation_status !== 'all_set');
        });

        // These variables are calculated but not stored in state since they're derived from driverRides
      } catch (error) {
        console.error('Error fetching driver bookings:', error);
      }
  };

  useEffect(() => {
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
              console.log('New booking created:', payload);
              
              // Check if this booking is available for this driver (Tesla Model Y match)
              const isCompatibleVehicle = payload.new.vehicle_type && 
                userProfile?.car_make && userProfile?.car_model &&
                payload.new.vehicle_type === `${userProfile.car_make} ${userProfile.car_model}`;
              
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
                  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmeKQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCEWW4+XNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgfCE');
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
              table: 'bookings'
            },
            (payload) => {
              console.log('Booking update received:', payload);
              // Refetch if this booking involves the current driver
              if (payload.new.driver_id === userProfile?.id || 
                  payload.old?.driver_id === userProfile?.id) {
                fetchDriverBookings();
              }
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
    
    console.log('=== FILTERING DEBUG ===');
    console.log('Current view:', rideView);
    console.log('Ride:', ride.id, 'Status:', ride.status, 'Payment status:', ride.payment_confirmation_status);
    console.log('Ride date:', rideDate, 'Today:', today);
    console.log('Passenger:', ride.passenger, 'Passengers object:', ride.passengers);
    
    if (rideView === "upcoming") {
      // For upcoming: rides in the future that are not completed and not "all_set"
      const isUpcoming = rideDate >= today && ride.status !== "completed" && ride.payment_confirmation_status !== "all_set";
      console.log('Is upcoming:', isUpcoming);
      return isUpcoming;
    } else {
      // For past rides, include:
      // 1. Rides that happened before today, OR
      // 2. Rides with status "completed", OR 
      // 3. Rides with payment_confirmation_status "all_set" (these are finished rides)
      const isPast = rideDate < today || ride.status === "completed" || ride.payment_confirmation_status === "all_set";
      console.log('Is past:', isPast);
      return isPast;
    }
  });
  
  console.log('=== FILTERED RESULTS ===');
  console.log('Total driver rides:', driverRides.length);
  console.log('Filtered rides for', rideView, ':', filteredRides.length);
  console.log('All Set rides:', driverRides.filter(r => r.payment_confirmation_status === "all_set"));
  console.log('Completed rides:', driverRides.filter(r => r.status === "completed"));

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
    <div className="min-h-screen bg-muted/20 pb-24">
      <div className="max-w-md mx-auto">
          {/* Enhanced Profile Header */}
          <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pt-8 pb-6 text-white relative">
            {/* Debug refresh button */}
            <button 
              onClick={() => {
                console.log('Manual refresh triggered');
                fetchDriverBookings();
              }}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-white/20">
                <AvatarImage 
                  src={userProfile?.profile_photo_url} 
                  alt={userProfile?.full_name}
                />
                <AvatarFallback className="bg-white/10 text-white text-lg font-semibold">
                  {userProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'D'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold">Welcome back</h1>
                <p className="text-white/90 text-base">{userProfile?.full_name || 'Driver'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                isOnline 
                  ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                  : 'bg-gray-500/20 text-gray-100 border border-gray-400/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                {isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Next Upcoming Ride Card - Sticky */}
          {nextRide && activeTab === "rides" && (
            <div className="sticky top-0 z-10 bg-muted/20 -mx-4 px-4 pt-4 pb-2">
              <Card className="bg-white border-l-4 border-l-primary shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">Next Ride</h3>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Confirmed
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Today at {nextRide.time}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm text-foreground font-medium truncate">{nextRide.from}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-destructive rounded-full"></div>
                      <span className="text-sm text-muted-foreground truncate">{nextRide.to}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <User className="h-3 w-3 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {nextRide.passenger} • {nextRide.passenger_count} passenger{nextRide.passenger_count > 1 ? 's' : ''} • {nextRide.luggage_count} bag{nextRide.luggage_count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">{nextRide.payment}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9"
                      onClick={async () => {
                        setSelectedBookingForMessaging(nextRide);
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
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <div className="relative">
                      <select 
                        className="appearance-none bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium h-9 pr-8 cursor-pointer"
                        onChange={(e) => {
                          const navApp = e.target.value;
                          if (!navApp) return;
                          
                          const pickup = encodeURIComponent(nextRide.from);
                          const dropoff = encodeURIComponent(nextRide.to);
                          
                          let url = '';
                          switch (navApp) {
                            case 'google':
                              url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                              break;
                            case 'apple':
                              url = `https://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=d`;
                              break;
                            case 'waze':
                              url = `https://www.waze.com/ul?q=${dropoff}&navigate=yes&from=${pickup}`;
                              break;
                            default:
                              url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                          }
                          
                          window.location.href = url;
                          
                          toast({
                            title: `Opening ${navApp === 'apple' ? 'Apple Maps' : navApp === 'waze' ? 'Waze' : 'Google Maps'}`,
                            description: "Navigation opened in new tab.",
                          });
                        }}
                      >
                        <option value="">Maps</option>
                        <option value="google">Google Maps</option>
                        <option value="apple">Apple Maps</option>
                        <option value="waze">Waze</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-foreground pointer-events-none" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
            <div className="space-y-4">
              {/* Enhanced Rides Header with Tabs */}
              <div className="bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                <div className="flex">
                  <button
                    onClick={() => setRideView("upcoming")}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      rideView === "upcoming"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    New Requests
                  </button>
                  <button
                    onClick={() => setRideView("past")}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      rideView === "past"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    Past Rides
                  </button>
                </div>
              </div>

              {/* Enhanced Rides List */}
              {rideView === "upcoming" && (
                <div className="space-y-3">
                  {/* Show only accepted/confirmed rides, not pending ones (they're handled by PendingRequestAlert) */}
                  {driverRides.filter(ride => ride.status === "accepted" || ride.status === "confirmed" || ride.status === "payment_confirmed").length === 0 ? (
                    <Card className="bg-white border-0 shadow-sm">
                      <CardContent className="p-8 text-center">
                        <div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">No upcoming rides</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                          Your accepted rides will appear here.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    driverRides
                      .filter(ride => ride.status === "accepted" || ride.status === "confirmed" || ride.status === "payment_confirmed")
                      .map((ride) => {
                        const isExpiringSoon = ride.payment_expires_at && 
                          new Date(ride.payment_expires_at).getTime() - Date.now() < 60 * 60 * 1000;

                        return (
                          <div key={ride.id} className="border-2 border-border/40 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                            <Card className="bg-transparent border-0 shadow-none">
                              <CardContent className="p-5">
                              {/* Status Badges */}
                              <div className="flex items-center justify-between mb-4">
                                {isExpiringSoon && (
                                  <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">
                                    ⏰ Expires soon
                                  </Badge>
                                )}
                                <StatusBadges 
                                  rideStatus={ride.ride_status || ride.status || 'pending'} 
                                  paymentStatus={ride.payment_confirmation_status || 'waiting_for_offer'}
                                  className="ml-auto"
                                />
                              </div>

                              {/* Date and Time */}
                              <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-xl">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">
                                  {ride.pickup_time ? new Date(ride.pickup_time).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  }) : ''} at {ride.pickup_time ? new Date(ride.pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                              </div>

                              {/* Enhanced Locations */}
                              <div className="space-y-3 mb-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-1 bg-green-500 rounded-full mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Pickup</p>
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {ride.pickup_location || 'Pickup location'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 pl-1.5">
                                  <div className="w-0.5 h-8 bg-border ml-1"></div>
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <div className="p-1 bg-red-500 rounded-full mt-1">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Dropoff</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {ride.dropoff_location || 'Dropoff location'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Enhanced Passenger Info */}
                              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/20 rounded-xl">
                                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                                  <AvatarImage 
                                    src={ride.passengers?.profile_photo_url} 
                                    alt={ride.passengers?.full_name}
                                  />
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                    {ride.passengers?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">
                                    {ride.passengers?.full_name || 'Passenger'}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {ride.passenger_count || 1} passenger{(ride.passenger_count || 1) > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Enhanced Fare Display */}
                              <div className="flex items-center justify-between mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                <span className="text-sm font-medium text-foreground">Fare</span>
                                <span className="text-xl font-bold text-primary">
                                  ${ride.final_price || ride.estimated_price || '85.00'}
                                </span>
                              </div>

                              {/* Enhanced Payment Status Display */}
                              <div className="mb-4">
                                <div className="p-3 bg-muted/30 rounded-xl border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">Payment Status</span>
                                    <StatusBadges 
                                      rideStatus={ride.ride_status || ride.status || 'pending'} 
                                      paymentStatus={ride.payment_confirmation_status || 'waiting_for_offer'}
                                    />
                                    {/* Debug info */}
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Status: {ride.ride_status || ride.status} | Payment: {ride.payment_confirmation_status}
                                    </div>
                                  </div>
                                  
                                  {/* Waiting for passenger payment */}
                                  {(ride.payment_confirmation_status === 'waiting_for_payment' || 
                                    ride.payment_confirmation_status === 'price_awaiting_acceptance') && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span>Waiting for passenger to confirm payment</span>
                                    </div>
                                  )}
                                  
                                  {/* Passenger confirmed payment */}
                                  {ride.payment_confirmation_status === 'passenger_paid' && (
                                    <div>
                                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
                                        <CheckCircle className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                          Passenger has confirmed payment
                                        </span>
                                      </div>
                                      <Button
                                        className="w-full bg-success hover:bg-success/90 text-white"
                                        onClick={() => handleConfirmPaymentFromCard(ride)}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirm Payment Received
                                      </Button>
                                    </div>
                                  )}

                                  {/* All Set Status */}
                                  {ride.payment_confirmation_status === 'all_set' && (
                                    <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                        ✅ Payment Received - All Set
                                      </span>
                                    </div>
                                  )}

                                  {/* Awaiting driver confirmation */}
                                  {ride.payment_confirmation_status === 'awaiting_driver_confirmation' && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600">
                                      <AlertCircle className="h-4 w-4" />
                                      <span>Awaiting your payment confirmation</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Message and Navigation Actions */}
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-10 flex items-center justify-center gap-2 border-border hover:bg-muted/50"
                                  onClick={() => {
                                    setSelectedBookingForMessaging(ride);
                                    if (ride.passenger_id) {
                                      supabase
                                        .from('passengers')
                                        .select('*')
                                        .eq('id', ride.passenger_id)
                                        .maybeSingle()
                                        .then(({ data: passenger, error }) => {
                                          if (passenger && !error) {
                                            setPassengerProfile(passenger);
                                          }
                                        });
                                    }
                                    setMessagingOpen(true);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Message
                                </Button>
                                <div className="relative">
                                  <select 
                                    className="appearance-none bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium h-10 pr-8 cursor-pointer hover:bg-primary/90 transition-colors"
                                    onChange={(e) => {
                                      const navApp = e.target.value;
                                      if (!navApp) return;
                                      
                                      const pickup = encodeURIComponent(ride.pickup_location || ride.from);
                                      const dropoff = encodeURIComponent(ride.dropoff_location || ride.to);
                                      
                                        let url = '';
                                        switch (navApp) {
                                          case 'google':
                                            url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                                            break;
                                          case 'apple':
                                            url = `https://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=d`;
                                            break;
                                          case 'waze':
                                            url = `https://www.waze.com/ul?q=${dropoff}&navigate=yes&from=${pickup}`;
                                            break;
                                          default:
                                            url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                                        }
                                      
                                      window.location.href = url;
                                      
                                      toast({
                                        title: `Opening ${navApp === 'apple' ? 'Apple Maps' : navApp === 'waze' ? 'Waze' : 'Google Maps'}`,
                                        description: "Navigation opened in new tab.",
                                      });
                                    }}
                                  >
                                    <option value="">Maps</option>
                                    <option value="google">Google Maps</option>
                                    <option value="apple">Apple Maps</option>
                                    <option value="waze">Waze</option>
                                  </select>
                                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-foreground pointer-events-none" />
                                </div>
                              </div>
                            </CardContent>
                            </Card>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {rideView === "past" && (
                <OrganizedBookingsList 
                  bookings={driverRides.filter(ride => 
                    ride.status === "completed" || 
                    ride.status === "cancelled" || 
                    ride.payment_confirmation_status === "all_set" ||
                    ride.ride_status === "paid"
                  )}
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
                  onViewSummary={handleViewSummary}
                  onCancelSuccess={() => {
                    // Refresh bookings after cancellation
                    window.location.reload();
                  }}
                />
              )}
            </div>
          )}

          {activeTab === "earnings" && (
            <EarningsSection driverId={userProfile?.id} />
          )}

          {activeTab === "todo" && (
            <ToDoList
              bookings={driverRides.filter(booking => {
                const now = new Date();
                const bookingDate = new Date(booking.pickup_time);
                const oneHourAfterPickup = new Date(bookingDate.getTime() + 60 * 60 * 1000);
                return booking.payment_confirmation_status === 'all_set' && now < oneHourAfterPickup;
              })}
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
              onViewSummary={handleViewSummary}
            />
          )}

          {activeTab === "messages" && userProfile?.id && (
            <MessagesTab 
              userType="driver"
              userId={userProfile.id}
              onSelectChat={(booking, otherUser) => {
                setSelectedBookingForMessaging(booking);
                setPassengerProfile(otherUser);
                setMessagingOpen(true);
              }}
            />
          )}

          {activeTab === "settings" && (
            <div className="space-y-3">
              <Card className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => setScheduleOpen(true)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Schedule Settings</h3>
                      <p className="text-sm text-muted-foreground">Manage your availability and working hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => setDriverPreferencesModalOpen(true)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Driver Preferences</h3>
                      <p className="text-sm text-muted-foreground">Edit your personal and vehicle information</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => setPaymentSettingsOpen(true)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Payment Settings</h3>
                      <p className="text-sm text-muted-foreground">Manage accepted payment methods and policies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200" onClick={handleLogout}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-600">Sign Out</h3>
                      <p className="text-sm text-muted-foreground">Sign out of your account</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
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

      {/* Summary Modal */}
      {selectedBooking && (
        <BookingSummaryModal
          isOpen={showSummaryModal}
          onClose={() => {
            setShowSummaryModal(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
        />
      )}

      {/* PDF Contributor Modal */}
      <ContributorInfoModal
        isOpen={showContributorModal}
        onClose={() => setShowContributorModal(false)}
        onSubmit={generateDriverReport}
        title="Driver Earnings Report"
        initialData={userProfile?.account_type && userProfile?.account_name ? {
          type: userProfile.account_type,
          name: userProfile.account_name
        } : null}
      />
    </div>
  );
};

export default DriverDashboard;