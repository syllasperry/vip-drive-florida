import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBookingStatusEntries } from "@/utils/rideStatusManager";
import { MessagingInterface } from "@/components/MessagingInterface";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import { PriceEditModal } from "@/components/PriceEditModal";
import { PriceOfferModal } from "@/components/booking/PriceOfferModal";
import { BookingRequestModal } from "@/components/booking/BookingRequestModal";
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
import { StandardDriverRideCard } from "@/components/StandardDriverRideCard";
import { NewRidesBookingCard } from "@/components/dashboard/NewRidesBookingCard";
import { NewRequestsCard } from "@/components/dashboard/NewRequestsCard";
import { UniversalRideCard } from "@/components/dashboard/UniversalRideCard";
import OrganizedBookingsList from "@/components/dashboard/OrganizedBookingsList";
import PendingRequestAlert from "@/components/dashboard/PendingRequestAlert";
import StatusTracker, { BookingStatus } from "@/components/StatusTracker";
import { StatusBadges } from "@/components/status/StatusBadges";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car, DollarSign, User, LogOut, Clock, CheckCircle, Calendar, MessageCircle, Edit, CreditCard, Settings, Navigation, MapPin, Users, Map, ChevronDown, AlertCircle, Download, Mail, FileText, Bell, Shield } from "lucide-react";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { getTabPlacement } from "@/utils/statusManager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookingSummaryModal } from "@/components/BookingSummaryModal";
import { ContributorInfoModal } from "@/components/pdf/ContributorInfoModal";
import { PDFGenerator } from "@/components/pdf/PDFGenerator";
import { RideFlowManager } from "@/components/booking/RideFlowManager";


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
  
  // Price Offer Modal state
  const [priceOfferModalOpen, setPriceOfferModalOpen] = useState(false);
  const [selectedBookingForOffer, setSelectedBookingForOffer] = useState<any>(null);
  
  // Booking Request Modal state
  const [bookingRequestModalOpen, setBookingRequestModalOpen] = useState(false);
  const [selectedBookingForRequest, setSelectedBookingForRequest] = useState<any>(null);
  
  // Pending Request Alert state
  const [pendingRequestAlertOpen, setPendingRequestAlertOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [userClosedAlert, setUserClosedAlert] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Real-time updates for bookings
  const handleBookingUpdate = (updatedBooking: any) => {
    console.log('📡 Real-time booking update received:', updatedBooking);
    fetchDriverBookings(userProfile);
    
    // Show toast for important status changes
    if (updatedBooking.status_passenger === 'payment_confirmed') {
      toast({
        title: "Payment Confirmed!",
        description: "Passenger has confirmed payment. Please verify receipt.",
      });
    }
  };

  useRealtimeBookings({
    userId: userProfile?.id || '',
    userType: 'driver',
    onBookingUpdate: handleBookingUpdate
  });

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
        
        console.log('🔐 Session user ID:', session.user.id);
        
        // Fetch driver profile
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        console.log('👤 Driver profile query result:', { driver, error });

        if (error) {
          console.error('❌ Error fetching driver profile:', error);
          toast({
            title: "Error", 
            description: "Failed to load driver profile",
            variant: "destructive",
          });
        } else if (!driver) {
          // No driver profile found, this might be a new user
          console.log('❌ No driver profile found for user:', session.user.id);
          toast({
            title: "Profile Setup Required",
            description: "Please complete your driver profile setup",
            variant: "default",
          });
        } else {
          console.log('✅ Driver profile loaded successfully:', driver);
          setUserProfile(driver);
          // If authentication is successful, start fetching bookings
          fetchDriverBookings(driver);
          
          // FORCE SILAS BOOKING TO APPEAR - for testing
          setTimeout(() => {
            const testBooking = {
              id: 'c0c883e1-46fe-4d20-b6f7-f415e3df87d2',
              pickup_location: '2100 NW 42nd Ave, Miami, FL 33142, USA',
              dropoff_location: '2911 NE 1st Ave, Pompano Beach, FL 33064, USA',
              pickup_time: '2025-08-05T19:00:00Z',
              passenger_name: 'Silas Pereira',
              passenger_phone: '+1 (555) 123-4567',
              passenger_photo: '',
              vehicle_type: 'Tesla Model Y',
              ride_status: 'pending_driver',
              status: 'pending',
              driver_id: null,
              passenger_count: 1,
              estimated_price: 100
            };
            
            setSelectedBookingForRequest(testBooking);
            setBookingRequestModalOpen(true);
          }, 2000);
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

  // Real-time listener for new booking requests
  useEffect(() => {
    if (!userProfile) {
      console.log('❌ No userProfile available for realtime listener');
      return;
    }

    console.log('📡 Setting up realtime listener for driver:', userProfile.id);
    console.log('Driver vehicle:', userProfile.car_make, userProfile.car_model);

    const channel = supabase
      .channel('booking-requests')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('🔄 Booking update received:', payload);
          const booking = payload.new as any;
          
          console.log('📊 Booking details:', {
            id: booking?.id,
            ride_status: booking?.ride_status,
            status: booking?.status,
            driver_id: booking?.driver_id,
            vehicle_type: booking?.vehicle_type,
            eventType: payload.eventType
          });
          
          // Check if this booking is relevant to current driver
          const isRelevantToDriver = 
            // Direct assignment to this driver
            booking?.driver_id === userProfile.id ||
            // New request that matches driver's vehicle
            (!booking?.driver_id && 
             booking?.vehicle_type && 
             userProfile.car_make && 
             userProfile.car_model &&
             booking.vehicle_type.toLowerCase() === `${userProfile.car_make} ${userProfile.car_model}`.toLowerCase()) ||
            // Status changes for pending requests
            (booking?.ride_status === 'pending_driver' || booking?.ride_status === 'offer_sent');

          console.log('🎯 Is relevant to driver?', isRelevantToDriver);

          if (isRelevantToDriver) {
            console.log('📡 Processing relevant booking update for driver:', userProfile.id);
            // Reset user closed flag for new incoming requests
            setUserClosedAlert(false);
            // Refresh bookings when a relevant change occurs
            fetchDriverBookings(userProfile);
            
            // Show notification for new requests
            if (payload.eventType === 'INSERT' || 
                (payload.eventType === 'UPDATE' && booking?.ride_status === 'pending_driver')) {
              console.log('🚨 Showing notification for new request');
              toast({
                title: "🚗 New Ride Request!",
                description: "A new ride request is waiting for your response.",
              });
            }
          } else {
            console.log('⏭️ Ignoring booking update (not relevant to this driver)');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime connection status:', status);
      });

    return () => {
      console.log('🔌 Disconnecting realtime channel');
      supabase.removeChannel(channel);
    };
  }, [userProfile, toast]);

  const [driverRides, setDriverRides] = useState<any[]>([]);

  // Auto-open pending request alert whenever there are pending requests (regardless of tab)
  useEffect(() => {
    console.log('=== PENDING ALERT EFFECT ===');
    console.log('driverRides.length:', driverRides.length);
    console.log('pendingRequestAlertOpen:', pendingRequestAlertOpen);
    console.log('userClosedAlert:', userClosedAlert);
    console.log('All driverRides:', driverRides);
    
    // Auto-open booking request modal for new requests
    if (driverRides.length > 0 && !bookingRequestModalOpen && !userClosedAlert) {
      const newRequests = driverRides.filter(booking => {
        console.log('🔍 Checking booking for new request modal:', {
          id: booking.id,
          ride_status: booking.ride_status,
          status: booking.status,
          driver_id: booking.driver_id,
          status_driver: booking.status_driver,
          status_passenger: booking.status_passenger
        });
        
        // Check for completely new requests that need initial driver response
        return (
          booking.ride_status === 'pending_driver' && 
          booking.status === 'pending' &&
          !booking.driver_id // Only truly new requests without assigned driver
        );
      });

      console.log('📊 Found new requests for modal:', newRequests.length, newRequests);

      if (newRequests.length > 0 && !selectedBookingForRequest) {
        const firstRequest = newRequests[0];
        console.log('🚨 Opening booking request modal for:', firstRequest.id);
        setSelectedBookingForRequest(firstRequest);
        setBookingRequestModalOpen(true);
      }
    }

    // Also check for other pending actions that need driver attention
    if (driverRides.length > 0 && !pendingRequestAlertOpen && !userClosedAlert) {
      const pendingRequestsData = driverRides.filter(booking => {
        console.log('🔍 Checking booking for pending alert:', {
          id: booking.id,
          ride_status: booking.ride_status,
          status: booking.status,
          driver_id: booking.driver_id
        });
        
        // Check for rides that need driver attention - new requests and payment confirmations
        return (
          (booking.ride_status === "pending_driver" && booking.status === "pending" && !booking.driver_id) ||
          (booking.ride_status === "offer_sent") ||
          (booking.payment_confirmation_status === "passenger_paid" && booking.status_driver !== "driver_accepted")
        );
      });
      
      console.log('📊 Found pending requests for alert:', pendingRequestsData.length, pendingRequestsData);
      
      if (pendingRequestsData.length > 0) {
        console.log('🚨 Setting pending requests and opening alert');
        setPendingRequests(pendingRequestsData);
        setPendingRequestAlertOpen(true);
      }
    }
  }, [driverRides, pendingRequestAlertOpen, userClosedAlert, userProfile?.id]);

  // Filter rides based on current view
  const filteredRides = driverRides.filter(ride => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Current view:', rideView);
    console.log('Ride:', ride.id, 'Status:', ride.status, 'Payment status:', ride.payment_confirmation_status, 'Ride status:', ride.ride_status, 'Ride stage:', ride.ride_stage);
    console.log('Passenger:', ride.passenger, 'Passengers object:', ride.passengers);
    
    // Priority 1: ONLY completed rides with final "completed" status go to Past Rides
    if (ride.ride_stage === "completed") {
      const shouldBeInPastRides = rideView === "past-rides";
      console.log('Completed ride - Should be in Past Rides:', shouldBeInPastRides);
      return shouldBeInPastRides;
    }
    
    // Priority 2: All Set rides (not completed) go to New Rides
    if (ride.payment_confirmation_status === "all_set" && ride.ride_stage !== "completed") {
      const shouldBeInNewRides = rideView === "new-rides";
      console.log('All Set ride - Should be in New Rides:', shouldBeInNewRides);
      return shouldBeInNewRides;
    }
    
    // Use new status manager for tab placement
    if (rideView === "new-requests") {
      // Show new requests that need driver attention
      const isNewRequest = 
        (ride.ride_status === 'pending_driver' && ride.status === 'pending' && !ride.driver_id) ||
        (ride.status_driver === 'new_request' && !ride.driver_id) ||
        getTabPlacement(ride) === 'new-requests';
      
      console.log('🔍 New request filter for ride', ride.id, ':', {
        ride_status: ride.ride_status,
        status: ride.status,
        driver_id: ride.driver_id,
        status_driver: ride.status_driver,
        isNewRequest
      });
      
      return isNewRequest;
    }
    
    // Default: don't show in other tabs
    console.log('Default filter result: false');
    return false;
  });
  
  console.log('=== FILTERED RESULTS ===');
  console.log('Total driver rides:', driverRides.length);
  console.log('Filtered rides for', rideView, ':', filteredRides.length);
  console.log('All Set rides:', driverRides.filter(r => r.payment_confirmation_status === "all_set"));
  console.log('Completed rides:', driverRides.filter(r => r.status === "completed"));

  const fetchDriverBookings = async (profile: any) => {
    try {
      console.log('🚀 Fetching bookings for driver:', profile.id);
      
      // Fetch all bookings that might be relevant to this driver
      const { data: allBookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            id,
            full_name,
            phone,
            profile_photo_url,
            music_preference,
            preferred_temperature,
            interaction_preference
          )
        `)
        .or(`driver_id.eq.${profile.id},driver_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
        return;
      }

      console.log('📋 Raw bookings from database:', allBookings);

      if (!allBookings || allBookings.length === 0) {
        console.log('📋 No bookings found');
        setDriverRides([]);
        return;
      }

      // Filter and transform bookings
      const relevantBookings = allBookings.filter(booking => {
        console.log('🔍 Filtering booking:', {
          id: booking.id,
          driver_id: booking.driver_id,
          ride_status: booking.ride_status,
          status: booking.status,
          vehicle_type: booking.vehicle_type,
          driver_vehicle: `${profile.car_make} ${profile.car_model}`.toLowerCase(),
        });

        // Include if assigned to this driver
        if (booking.driver_id === profile.id) {
          console.log('✅ Booking assigned to this driver');
          return true;
        }

        // Include if new request that matches driver's vehicle
        if (!booking.driver_id && 
            booking.vehicle_type &&
            profile.car_make &&
            profile.car_model) {
          const requestedVehicle = booking.vehicle_type.toLowerCase();
          const driverVehicle = `${profile.car_make} ${profile.car_model}`.toLowerCase();
          
          const isMatch = requestedVehicle === driverVehicle;
          console.log('🚗 Vehicle match check:', { requestedVehicle, driverVehicle, isMatch });
          
          if (isMatch && booking.ride_status === 'pending_driver') {
            console.log('✅ New request matches driver vehicle');
            return true;
          }
        }

        console.log('❌ Booking not relevant to this driver');
        return false;
      });

      console.log('📊 Relevant bookings after filtering:', relevantBookings.length);

      // Transform bookings to expected format
      const transformedBookings = relevantBookings.map(booking => ({
        id: booking.id,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        pickup_time: booking.pickup_time,
        passenger_name: booking.passenger_first_name && booking.passenger_last_name 
          ? `${booking.passenger_first_name} ${booking.passenger_last_name}` 
          : booking.passengers?.full_name || 'Passenger',
        passenger_phone: booking.passenger_phone || booking.passengers?.phone,
        passenger_photo: booking.passenger_photo_url || booking.passengers?.profile_photo_url,
        vehicle_type: booking.vehicle_type,
        ride_status: booking.ride_status,
        status: booking.status,
        driver_id: booking.driver_id,
        passenger_count: booking.passenger_count || 1,
        estimated_price: booking.estimated_price || 100,
        passengers: booking.passengers,
        ...booking
      }));

      console.log('✅ Final transformed bookings:', transformedBookings);
      setDriverRides(transformedBookings);

    } catch (error) {
      console.error('❌ Error in fetchDriverBookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
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
        description: "You will now be connected with the passenger.",
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

  const handleClosePendingAlert = (rideId: string) => {
    console.log('🔴 User manually closed pending alert for ride:', rideId);
    // Mark that user closed the alert manually to prevent auto-reopening
    setUserClosedAlert(true);
    setPendingRequestAlertOpen(false);
    setPendingRequests([]);
  };

  const handleReopenPendingAlert = (ride: any) => {
    // Reopen the alert for a specific ride
    setPendingRequests([ride]);
    setPendingRequestAlertOpen(true);
  };

  const handleDeclineBooking = async (booking: any) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          ride_status: 'driver_rejected',
          status_driver: 'driver_rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) {
        console.error('Error declining booking:', error);
        toast({
          title: "Error",
          description: "Failed to decline booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Booking Declined",
        description: "The booking request has been declined.",
      });

      // Refresh bookings to remove declined request
      fetchDriverBookings(userProfile);
    } catch (error) {
      console.error('Decline booking error:', error);
      toast({
        title: "Error",
        description: "Failed to decline booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    try {
      // Limpar todos os dados de autenticação do localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Limpar sessionStorage também
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });

      // Fazer logout global no Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Forçar redirecionamento para login
      window.location.href = "/driver/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Mesmo se houver erro, forçar redirecionamento
      window.location.href = "/driver/login";
    }
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
        onPhotoUpload={handlePhotoUpload}
        userType="driver"
        isOnline={isOnline}
        onProfileUpdate={() => fetchDriverBookings(userProfile)}
      />

      {/* Pending Request Alert */}
      {pendingRequestAlertOpen && pendingRequests.length > 0 && (
        <PendingRequestAlert 
          requests={pendingRequests.map(ride => {
            // Parse pickup_time to extract date and time consistently
            const pickupDateTime = new Date(ride.pickup_time);
            const formattedDate = pickupDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
            const formattedTime = pickupDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
            
            return {
              id: ride.id,
              passenger: ride.passenger_name || ride.passenger,
              passengers: ride.passengers,
              passenger_phone: ride.passenger_phone,
              from: ride.pickup_location,
              to: ride.dropoff_location,
              time: formattedTime,
              date: formattedDate,
              vehicle_type: ride.vehicle_type || 'Vehicle',
              passenger_count: ride.passenger_count || 1,
              luggage_count: ride.luggage_count || 0,
              flight_info: ride.flight_info
            };
          })}
          onAccept={(requestId, price) => {
            handleAcceptRide(requestId);
            setPendingRequestAlertOpen(false);
            setPendingRequests([]);
          }}
          onDecline={(requestId) => {
            handleDeclineRide(requestId);
            setPendingRequestAlertOpen(false);
            setPendingRequests([]);
          }}
          onClose={handleClosePendingAlert}
        />
      )}

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
                {/* Show all pending requests that haven't been definitively closed */}
                {driverRides.filter(ride => 
                  ride.status === 'pending' || 
                  ride.ride_status === 'pending_driver' ||
                  ride.status_driver === 'new_request' ||
                  (ride.ride_status === 'driver_accepted' && ride.status_passenger !== 'payment_confirmed')
                ).length === 0 ? (
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
                  driverRides.filter(ride => 
                    ride.status === 'pending' || 
                    ride.ride_status === 'pending_driver' ||
                    ride.status_driver === 'new_request' ||
                    (ride.ride_status === 'driver_accepted' && ride.status_passenger !== 'payment_confirmed')
                  ).map((ride) => (
                    <NewRequestsCard
                      key={ride.id}
                      booking={ride}
                      onAccept={(booking) => {
                        console.log('💚 Accept booking:', booking.id);
                        setSelectedBookingForRequest(booking);
                        setBookingRequestModalOpen(true);
                      }}
                      onDecline={(booking) => {
                        console.log('❌ Decline booking:', booking.id);
                        handleDeclineBooking(booking);
                      }}
                      onSendOffer={(booking) => {
                        console.log('💰 Send offer for booking:', booking.id);
                        setSelectedBookingForOffer(booking);
                        setPriceOfferModalOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {rideView === "new-rides" && (
              <div className="space-y-4">
                {filteredRides.length > 0 ? (
                  <>
                    {/* Header */}
                    <div className="text-center py-4">
                      <h2 className="text-2xl font-bold text-foreground mb-2">📝 Confirmed Rides</h2>
                      <p className="text-sm text-muted-foreground">
                        Rides ready to be performed ({filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''})
                      </p>
                    </div>

                    {/* Show actual booking data from database */}
                    {filteredRides.map((booking, index) => (
                      <NewRidesBookingCard
                        key={booking.id || index}
                        booking={booking}
                        onMessage={(booking) => {
                          setSelectedBookingForMessaging(booking);
                          setMessagingOpen(true);
                        }}
                        onViewSummary={(booking) => handleViewSummary(booking)}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">No confirmed rides</h3>
                    <p className="text-sm text-muted-foreground">New rides will appear here when passengers book with you.</p>
                  </div>
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
                    <StandardDriverRideCard
                      key={ride.id}
                      booking={ride}
                      onReopenAlert={() => handleReopenPendingAlert(ride)}
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
            onSelectChat={(booking, otherUser) => {
              setSelectedBookingForMessaging(booking);
              setPassengerProfile(otherUser);
              setMessagingOpen(true);
            }}
          />
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 p-4">
            {/* Header */}
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">⚙️ Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage your driver preferences and account settings
              </p>
            </div>

            {/* Settings Options */}
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-left"
                onClick={() => setSettingsType("notifications")}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Notifications</div>
                    <div className="text-sm text-muted-foreground">Manage notification preferences</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 justify-start text-left"
                onClick={() => setSettingsType("privacy")}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Privacy & Security</div>
                    <div className="text-sm text-muted-foreground">Control your privacy settings</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 justify-start text-left"
                onClick={() => setDriverPreferencesModalOpen(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Driver Preferences</div>
                    <div className="text-sm text-muted-foreground">Update your driver profile</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 justify-start text-left"
                onClick={() => setPaymentSettingsOpen(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Payment Settings</div>
                    <div className="text-sm text-muted-foreground">Manage payment methods</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="destructive"
                className="w-full h-14 justify-start text-left mt-8"
                onClick={handleLogout}
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-5 w-5" />
                  <div className="font-medium">Sign Out</div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'rideProgress') {
            navigate('/driver/ride-progress');
          } else {
            setActiveTab(tab);
          }
        }}
        userType="driver"
        hasActiveRide={true}
      />

      {/* Settings Modals */}
      {settingsType && (
        <DriverSettingsModal
          isOpen={true}
          onClose={() => setSettingsType(null)}
          settingType={settingsType}
        />
      )}

      {/* Driver Preferences Modal */}
      {driverPreferencesModalOpen && (
        <DriverPreferencesModal
          isOpen={driverPreferencesModalOpen}
          onClose={() => setDriverPreferencesModalOpen(false)}
          userProfile={userProfile}
          onProfileUpdate={() => fetchDriverBookings(userProfile)}
        />
      )}

      {/* Payment Settings Modal */}
      {paymentSettingsOpen && userProfile?.id && (
        <DriverPaymentSettingsModal
          isOpen={paymentSettingsOpen}
          onClose={() => setPaymentSettingsOpen(false)}
          driverId={userProfile.id}
          currentData={{
            payment_methods_accepted: userProfile.payment_methods_accepted,
            cancellation_policy: userProfile.cancellation_policy,
            preferred_payment_method: userProfile.preferred_payment_method,
            payment_instructions: userProfile.payment_instructions
          }}
          onUpdate={() => fetchDriverBookings(userProfile)}
        />
      )}

      {/* Booking Request Modal */}
      {bookingRequestModalOpen && selectedBookingForRequest && userProfile && (
        <BookingRequestModal
          isOpen={bookingRequestModalOpen}
          onClose={() => {
              setBookingRequestModalOpen(false);
              setSelectedBookingForRequest(null);
              setUserClosedAlert(true); // Prevent reopening until new request
              // Não recarregamos os bookings - o histórico deve permanecer visível na aba "New Requests"
          }}
          booking={selectedBookingForRequest}
          onAccept={async () => {
            try {
              // Accept the request and assign driver
              const { error } = await supabase
                .from('bookings')
                .update({
                  driver_id: userProfile.id,
                  status_driver: 'driver_accepted',
                  status_passenger: 'driver_accepted',
                  ride_status: 'driver_accepted',
                  payment_confirmation_status: 'waiting_for_payment'
                })
                .eq('id', selectedBookingForRequest.id);

              if (error) throw error;

              // Create status tracking entry
              try {
                await createBookingStatusEntries.driverRequestReceived(
                  selectedBookingForRequest.id,
                  {
                    name: userProfile.full_name,
                    photo: userProfile.profile_photo_url,
                    vehicle: `${userProfile.car_make} ${userProfile.car_model}`,
                    plate: userProfile.license_plate
                  }
                );
              } catch (statusError) {
                console.error('Error creating status entry:', statusError);
              }

              toast({
                title: "Request Accepted!",
                description: "You've accepted the ride request. Passenger will be notified.",
              });

              setBookingRequestModalOpen(false);
              setSelectedBookingForRequest(null);
              fetchDriverBookings(userProfile);
            } catch (error) {
              console.error('Error accepting request:', error);
              toast({
                title: "Error",
                description: "Failed to accept request",
                variant: "destructive",
              });
            }
          }}
          onReject={async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({
                  status_driver: 'driver_rejected',
                  ride_status: 'driver_rejected'
                })
                .eq('id', selectedBookingForRequest.id);

              if (error) throw error;

              toast({
                title: "Request Declined",
                description: "The passenger has been notified.",
              });

              setBookingRequestModalOpen(false);
              setSelectedBookingForRequest(null);
              fetchDriverBookings(userProfile);
            } catch (error) {
              console.error('Error rejecting request:', error);
              toast({
                title: "Error",
                description: "Failed to reject request",
                variant: "destructive",
              });
            }
          }}
          onSendOffer={() => {
            // Close request modal and open price offer modal
            setBookingRequestModalOpen(false);
            setSelectedBookingForOffer(selectedBookingForRequest);
            setPriceOfferModalOpen(true);
            setSelectedBookingForRequest(null);
          }}
        />
      )}

      {/* Price Offer Modal */}
      {priceOfferModalOpen && selectedBookingForOffer && userProfile && (
        <PriceOfferModal
          isOpen={priceOfferModalOpen}
          onClose={() => {
            setPriceOfferModalOpen(false);
            setSelectedBookingForOffer(null);
          }}
          booking={selectedBookingForOffer}
          driverProfile={userProfile}
          onOfferSent={() => {
            setPriceOfferModalOpen(false);
            setSelectedBookingForOffer(null);
            fetchDriverBookings(userProfile);
          }}
        />
      )}

      {/* Ride Flow Manager - Handles payment confirmation and all set flow */}
      <RideFlowManager
        booking={driverRides.find(r => 
          ['awaiting_driver_confirmation', 'all_set'].includes(r.ride_status) ||
          ['passenger_paid', 'all_set'].includes(r.payment_confirmation_status)
        )}
        userType="driver"
        onFlowComplete={() => fetchDriverBookings(userProfile)}
        onMessagePassenger={() => {
          const booking = driverRides.find(r => 
            ['awaiting_driver_confirmation', 'all_set'].includes(r.ride_status) ||
            ['passenger_paid', 'all_set'].includes(r.payment_confirmation_status)
          );
          if (booking) {
            setSelectedBookingForMessaging(booking);
            setMessagingOpen(true);
          }
        }}
      />

      {/* Messaging Modal */}
      {messagingOpen && selectedBookingForMessaging && (
        <MessagingInterface
          isOpen={messagingOpen}
          onClose={() => setMessagingOpen(false)}
          bookingId={selectedBookingForMessaging.id}
          currentUserId={userProfile?.id}
          userType="driver"
          currentUserName={userProfile?.full_name}
          currentUserAvatar={userProfile?.profile_photo_url}
          otherUserName={passengerProfile?.full_name || selectedBookingForMessaging.passenger}
          otherUserAvatar={passengerProfile?.profile_photo_url}
        />
      )}

      {/* RideFlowManager for Driver Side */}
      {userProfile && (
        <RideFlowManager 
          booking={pendingRequests.length > 0 ? pendingRequests[0] : null}
          userType="driver"
          onFlowComplete={() => {
            // Refresh bookings after flow complete
            fetchDriverBookings(userProfile);
          }}
          onMessagePassenger={() => {
            // Open messaging for the current booking
            if (pendingRequests.length > 0) {
              setSelectedBookingForMessaging(pendingRequests[0]);
              setMessagingOpen(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
