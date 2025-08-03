import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagesInbox } from "@/components/messaging/MessagesInbox";
import { ConversationScreen } from "@/components/messaging/ConversationScreen";
import { EnhancedSettingsModal } from "@/components/EnhancedSettingsModal";
import { PaymentsTab } from "@/components/PaymentsTab";
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
import { EnhancedBookingCard } from "@/components/booking/EnhancedBookingCard";
import { UniversalRideCard } from "@/components/dashboard/UniversalRideCard";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { FareConfirmationAlert } from "@/components/FareConfirmationAlert";
import { PaymentConfirmationModal } from "@/components/PaymentConfirmationModal";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { OfferAcceptanceModal } from "@/components/booking/OfferAcceptanceModal";
import { TodoTab } from "@/components/booking/TodoTab";
import { NotificationManager } from "@/components/NotificationManager";
import { ChatNotificationBadge } from "@/components/ChatNotificationBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, Clock, MessageCircle, CreditCard, Settings, Car, CalendarDays, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passenger, setPassenger] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingView, setBookingView] = useState<"upcoming" | "past">("upcoming");
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedBookingForSummary, setSelectedBookingForSummary] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedOtherUser, setSelectedOtherUser] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);
  const [offerAcceptanceModalOpen, setOfferAcceptanceModalOpen] = useState(false);
  const [selectedBookingForOffer, setSelectedBookingForOffer] = useState<any>(null);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);

  // Keep existing state variables
  const [showConversation, setShowConversation] = useState(false);
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const [showRideConfirmation, setShowRideConfirmation] = useState(false);
  const [pendingFareBooking, setPendingFareBooking] = useState<any>(null);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  // Group bookings
  const groupedBookings = {
    upcoming: bookings.filter(booking => {
      const bookingDate = new Date(booking.pickup_time);
      const now = new Date();
      return (booking.ride_stage !== 'completed' && !['completed', 'cancelled', 'declined', 'offer_declined'].includes(booking.ride_status)) ||
             (bookingDate >= now && !['completed', 'cancelled', 'declined', 'offer_declined'].includes(booking.ride_status));
    }),
    pastRides: bookings.filter(booking => {
      const bookingDate = new Date(booking.pickup_time);
      const now = new Date();
      return booking.ride_stage === 'completed' || 
             ['completed', 'cancelled', 'declined', 'offer_declined'].includes(booking.ride_status) ||
             (bookingDate < now && !['pending_driver', 'offer_sent', 'waiting_for_payment', 'payment_confirmed', 'ready_to_go'].includes(booking.ride_status));
    })
  };

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
          sender_id: passenger?.id,
          sender_type: 'passenger',
          message_text: `I've accepted the fare of $${pendingFareBooking?.final_price?.toFixed(2)}. Proceeding with payment.`
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

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      fetchBookings();
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
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

        const { data: passengerData, error } = await supabase
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
          setPassenger(passengerData);
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

      await supabase.auth.signOut({ scope: 'global' });
      window.location.href = "/passenger/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/passenger/login";
    }
  };

  // Handle tab navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'bookings':
        // Already on bookings page - just update active tab
        break;
      case 'messages':
        // Messages tab will be handled by the tab content
        break;
      case 'payments':
        // Payments tab will be handled by the tab content
        break;
      case 'settings':
        setSettingsModalOpen(true);
        break;
    }
  };

  // Fetch real bookings from Supabase
  const fetchBookings = async () => {
    if (!passenger?.id) return;

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
            profile_photo_url,
            preferred_payment_method,
            payment_instructions
          ),
          vehicles:vehicle_id (
            id,
            type,
            description,
            image_url
          )
        `)
        .eq('passenger_id', passenger.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(bookingsData || []);
      
      // Check for pending offer acceptance - driver sent price and waiting for passenger approval
      const pendingOfferBooking = bookingsData?.find(booking => 
        booking.ride_status === 'offer_sent' && 
        booking.payment_confirmation_status === 'price_awaiting_acceptance' &&
        booking.final_price // Ensure there's a price to show
      );
      
      if (pendingOfferBooking && !offerAcceptanceModalOpen) {
        console.log('Found pending offer booking:', pendingOfferBooking);
        setSelectedBookingForOffer(pendingOfferBooking);
        setOfferAcceptanceModalOpen(true);
      }
      
      // Check for pending fare confirmation (legacy support)
      const pendingBooking = bookingsData?.find(booking => booking.status === 'price_proposed');
      setPendingFareBooking(pendingBooking || null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleSelectChat = (booking: any, otherUser: any) => {
    setSelectedBooking(booking);
    setSelectedOtherUser(otherUser);
    setShowConversation(true);
  };

  const handleBackToInbox = () => {
    setShowConversation(false);
    setSelectedBooking(null);
    setSelectedOtherUser(null);
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription for booking status updates
    if (passenger?.id) {
      const channel = supabase
        .channel('passenger-booking-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings',
            filter: `passenger_id=eq.${passenger.id}`
          },
          (payload) => {
            console.log('Booking update received:', payload);
            
            // Check if this is a driver offering a price
            if (payload.new?.ride_status === 'offer_sent' && 
                payload.new?.payment_confirmation_status === 'price_awaiting_acceptance' &&
                payload.new?.final_price) {
              console.log('Driver sent price offer, showing modal');
              
              // Show toast notification
              toast({
                title: "New Price Offer!",
                description: `Your driver has offered $${payload.new.final_price} for the ride.`,
                duration: 5000,
              });
            }
            
            fetchBookings(); // Refresh bookings when changes occur
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [passenger, toast]);

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
      {passenger?.id && (
        <NotificationManager 
          userId={passenger.id}
          userType="passenger"
        />
      )}
      
      {/* Main Container - Clean Mobile Layout inspired by Airbnb */}
      <div className="max-w-sm mx-auto min-h-screen flex flex-col">
        
        {/* Header Section */}
        <div className="p-4 bg-background">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {activeTab === 'bookings' && 'Bookings'}
              {activeTab === 'todo' && 'To-Do'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'payments' && 'Payments'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setProfileEditOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-muted/50 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={passenger?.profile_photo_url} 
                    alt={passenger?.full_name || "Profile"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {passenger?.full_name ? passenger.full_name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>

          {/* Tab Navigation - Only for Bookings */}
          {activeTab === "bookings" && (
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
          )}
        </div>

         {/* Fare Confirmation Alert - Always at Top when present */}
        {pendingFareBooking && activeTab === "bookings" && (
          <div className="px-4 mb-4">
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
          </div>
        )}

        {/* All Set Banner moved inside individual booking cards */}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === "bookings" && (
            <div className="p-4 space-y-4">
              {bookingView === "upcoming" && groupedBookings.upcoming.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Upcoming</h3>
                  <div className="space-y-3">
                     {groupedBookings.upcoming.map((booking) => (
                       booking.payment_confirmation_status === 'all_set' ? (
                         <UniversalRideCard
                           key={booking.id}
                           booking={booking}
                           userType="passenger"
                           onMessage={() => {
                             setSelectedBooking(booking);
                             setMessagingOpen(true);
                           }}
                           onViewSummary={() => {
                             setSelectedBookingForSummary(booking);
                             setSummaryModalOpen(true);
                           }}
                           onStatusUpdate={fetchBookings}
                         />
                       ) : (
                         <EnhancedBookingCard 
                           key={booking.id} 
                           booking={booking} 
                           userType="passenger"
                           onMessage={() => {
                             setSelectedBooking(booking);
                             setMessagingOpen(true);
                           }}
                           onViewSummary={() => {
                             setSelectedBookingForSummary(booking);
                             setSummaryModalOpen(true);
                           }}
                           onMakePayment={() => {
                             setSelectedBookingForPayment(booking);
                             setPaymentModalOpen(true);
                           }}
                           onAcceptOffer={() => handleAcceptFare(booking.id)}
                         />
                       )
                     ))}
                  </div>
                </div>
              )}
              
              {bookingView === "past" && groupedBookings.pastRides.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Past Rides</h3>
                  <div className="space-y-3">
                      {groupedBookings.pastRides.map((booking) => (
                        booking.ride_stage === 'completed' ? (
                          <UniversalRideCard
                            key={booking.id}
                            booking={booking}
                            userType="passenger"
                            onMessage={() => {
                              setSelectedBooking(booking);
                              setMessagingOpen(true);
                            }}
                            onViewSummary={() => {
                              setSelectedBookingForSummary(booking);
                              setSummaryModalOpen(true);
                            }}
                            onStatusUpdate={fetchBookings}
                          />
                        ) : (
                          <EnhancedBookingCard 
                            key={booking.id} 
                            booking={booking} 
                            userType="passenger"
                            onMessage={() => {
                              setSelectedBooking(booking);
                              setMessagingOpen(true);
                            }}
                            onViewSummary={() => {
                              setSelectedBookingForSummary(booking);
                              setSummaryModalOpen(true);
                            }}
                            onMakePayment={() => {
                              setSelectedBookingForPayment(booking);
                              setPaymentModalOpen(true);
                            }}
                          />
                        )
                      ))}
                  </div>
                </div>
              )}

              {((bookingView === "upcoming" && groupedBookings.upcoming.length === 0) || 
                (bookingView === "past" && groupedBookings.pastRides.length === 0)) && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚗</span>
                  </div>
                  <h3 className="font-medium text-foreground mb-2">
                    {bookingView === "upcoming" ? "No upcoming rides" : "No past rides"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {bookingView === "upcoming" ? "Book your first ride to get started" : "Your completed rides will appear here"}
                  </p>
                  {bookingView === "upcoming" && (
                    <Button 
                      onClick={handleNewBooking}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "todo" && (
            <TodoTab
              userType="passenger"
              userId={passenger?.id || ""}
              onMessage={(booking) => {
                setSelectedBooking(booking);
                setMessagingOpen(true);
              }}
              onViewSummary={(booking) => {
                setSelectedBookingForSummary(booking);
                setSummaryModalOpen(true);
              }}
              onMakePayment={(booking) => {
                setSelectedBookingForPayment(booking);
                setPaymentModalOpen(true);
              }}
              onAcceptOffer={(booking) => handleAcceptFare(booking.id)}
            />
          )}

          {activeTab === "messages" && !showConversation && (
            <MessagesInbox
              userType="passenger"
              userId={passenger?.id || ""}
              onSelectChat={handleSelectChat}
            />
          )}

          {activeTab === "messages" && showConversation && selectedBooking && (
            <div className="fixed inset-0 z-50 bg-background">
              <ConversationScreen
                userType="passenger"
                booking={selectedBooking}
                otherUser={selectedOtherUser}
                currentUserId={passenger?.id || ""}
                currentUserName={passenger?.full_name || ""}
                currentUserAvatar={passenger?.profile_photo_url}
                onBack={handleBackToInbox}
              />
            </div>
          )}

          {activeTab === "payments" && (
            <div className="p-4">
              <PaymentsTab
                userId={passenger?.id || ""}
                userType="passenger"
                onViewSummary={(booking) => {
                  setSelectedBookingForSummary(booking);
                  setSummaryModalOpen(true);
                }}
              />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Settings</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Manage your account preferences and settings
                </p>
                <Button 
                  onClick={() => setSettingsModalOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Open Settings
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* New Booking Button - Only show on bookings tab */}
        {activeTab === "bookings" && (
          <div className="p-4 pb-24">
            <Button 
              onClick={handleNewBooking}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Booking
            </Button>
          </div>
        )}

        {/* Bottom Navigation - Hide when conversation is active */}
        {!(activeTab === "messages" && showConversation) && (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userType="passenger"
          />
        )}
      </div>

      {/* Modals */}
      
      <EnhancedSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        userId={passenger?.id}
        userType="passenger"
      />
      
      <ProfileEditModal 
        isOpen={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
        userProfile={passenger}
        onPhotoUpload={async () => {}} // Add photo upload handler if needed
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

      <OfferAcceptanceModal
        isOpen={offerAcceptanceModalOpen}
        onClose={() => setOfferAcceptanceModalOpen(false)}
        booking={selectedBookingForOffer}
        onAccept={() => {
          setOfferAcceptanceModalOpen(false);
          // Automatically open payment modal after accepting offer
          setSelectedBookingForPayment(selectedBookingForOffer);
          setPaymentModalOpen(true);
          fetchBookings();
        }}
        onDecline={() => {
          setOfferAcceptanceModalOpen(false);
          setSelectedBookingForOffer(null);
          fetchBookings();
        }}
      />

      {selectedBookingForPayment && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          booking={selectedBookingForPayment}
          onPaymentConfirmed={() => {
            setPaymentModalOpen(false);
            fetchBookings();
          }}
        />
      )}

      {/* Payment Confirmation Modal */}
      {selectedBookingForPayment && (
        <PaymentConfirmationModal
          isOpen={false} // Disable this for now, using PaymentModal instead
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedBookingForPayment(null);
          }}
          bookingData={selectedBookingForPayment}
          userType="passenger"
          onConfirmPayment={() => {}}
          paymentStatus={selectedBookingForPayment.payment_status || 'pending'}
        />
      )}

      {/* Passenger Preferences Modal */}
      <PassengerPreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        userProfile={passenger}
        onUpdate={() => {
          // Refresh user profile to reflect changes
          if (passenger?.id) {
            supabase
              .from('passengers')
              .select('*')
              .eq('id', passenger.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setPassenger(data);
                }
              });
          }
        }}
      />


      {/* Messaging Modal - Opens from booking cards */}
      {messagingOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-background">
          <ConversationScreen
            userType="passenger"
            booking={selectedBooking}
            otherUser={selectedBooking.drivers}
            currentUserId={passenger?.id || ""}
            currentUserName={passenger?.full_name || ""}
            currentUserAvatar={passenger?.profile_photo_url}
            onBack={() => {
              setMessagingOpen(false);
              setSelectedBooking(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;