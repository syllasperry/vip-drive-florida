import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, MessageCircle, CreditCard, Settings, LogOut, Plus, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessagingInterface } from "@/components/MessagingInterface";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import CelebrationModal from "@/components/CelebrationModal";
import { ReviewModal } from "@/components/ReviewModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // State declarations
  const [activeTab, setActiveTab] = useState("bookings");
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"notifications" | "privacy">("notifications");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string | null>(null);
  
  // Celebration modal states
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const [showRideConfirmation, setShowRideConfirmation] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    if (!userProfile?.id) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userProfile.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

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
      .from('passengers')
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

  // Authentication check and user data fetching
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No session, redirect to login
          navigate("/passenger/login");
          return;
        }

        setIsAuthenticated(true);
        
        // Fetch user profile
        const { data: passenger, error } = await supabase
          .from('passengers')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        } else {
          setUserProfile(passenger);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate("/passenger/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();

    // Listen for auth changes
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
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/");
    }
  };

  // Check for new account celebration
  useEffect(() => {
    const isNewAccount = localStorage.getItem("show_welcome_celebration");
    if (isNewAccount === "true") {
      setShowWelcomeCelebration(true);
      localStorage.removeItem("show_welcome_celebration");
    }
  }, []);

  // Simulate ride confirmation (in real app this would come from backend)
  useEffect(() => {
    const rideConfirmed = localStorage.getItem("ride_confirmed");
    if (rideConfirmed === "true") {
      setShowRideConfirmation(true);
      localStorage.removeItem("ride_confirmed");
    }
  }, []);

  const [bookings, setBookings] = useState([
    {
      id: "1",
      date: "2024-01-15",
      time: "14:30",
      from: "Miami International Airport",
      to: "Brickell City Centre",
      vehicle: "Tesla Model Y",
      status: "confirmed",
      driver: "John Smith",
      paymentMethod: "Visa ending in 4532",
      countdown: null
    },
    {
      id: "2", 
      date: "2024-01-18",
      time: "09:00",
      from: "Fort Lauderdale Airport",
      to: "Las Olas Boulevard",
      vehicle: "BMW Sedan",
      status: "payment_confirmed",
      driver: "Mike Rodriguez",
      paymentMethod: "Zelle",
      countdown: null
    },
    {
      id: "3",
      date: "2024-01-20",
      time: "16:00", 
      from: "Palm Beach Airport",
      to: "Worth Avenue",
      vehicle: "Mercedes Van",
      status: "pending",
      driver: null,
      paymentMethod: null,
      countdown: null
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "waiting_payment": return "bg-orange-100 text-orange-800";
      case "payment_confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmed";
      case "pending": return "Pending";
      case "waiting_payment": return "Waiting for Payment";
      case "payment_confirmed": return "Payment Confirmed";
      case "completed": return "Completed";
      default: return status;
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-card rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar 
                  className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => setProfileEditOpen(true)}
                >
                  <AvatarImage src={userProfile?.profile_photo_url || undefined} alt="Profile" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePhotoUpload(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Welcome back!</h1>
                <p className="text-lg font-medium text-primary">{userProfile?.full_name || 'VIP Member'}</p>
                <p className="text-muted-foreground">Manage your rides and bookings</p>
              </div>
            </div>
            <Button onClick={handleNewBooking} variant="luxury" className="flex items-center space-x-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span>New Booking</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-xl mb-6 shadow-lg overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { id: "bookings", label: "My Bookings", icon: Calendar },
              { id: "profile", label: "Profile", icon: User },
              { id: "messages", label: "Messages", icon: MessageCircle },
              { id: "payment", label: "Payment", icon: CreditCard },
              { id: "settings", label: "Settings", icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-card-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-xl p-6 shadow-lg">
          {activeTab === "bookings" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">My Bookings</h2>
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                        {booking.status === "waiting_payment" && booking.countdown && (
                          <div className="flex items-center space-x-1 text-orange-600">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs font-medium">{booking.countdown}h left</span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="ml-2 text-card-foreground">{booking.from}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">To:</span>
                        <span className="ml-2 text-card-foreground">{booking.to}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="ml-2 text-card-foreground">{booking.vehicle}</span>
                      </div>
                      {booking.driver && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Driver:</span>
                          <span className="ml-2 text-card-foreground">{booking.driver}</span>
                        </div>
                      )}
                      {booking.paymentMethod && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Payment:</span>
                          <span className="ml-2 text-card-foreground">{booking.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                    {booking.status === "waiting_payment" && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800">
                          If payment is not completed within 24 hours, the ride will be automatically canceled.
                        </p>
                        <Button 
                          size="sm" 
                          variant="luxury" 
                          className="mt-2"
                          onClick={() => {
                            setMessagingOpen(true);
                            // We'll handle the pre-filled message in the MessagingInterface component
                          }}
                        >
                          Complete Payment
                        </Button>
                      </div>
                    )}
                    {booking.status === "payment_confirmed" && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 flex items-center">
                          ✅ Payment Confirmed by Driver
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Your ride is fully confirmed and scheduled. Thank you!
                        </p>
                      </div>
                    )}
                    {booking.status === "payment_confirmed" && (
                      <div className="mt-3 flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedBookingForReview(booking.id);
                            setReviewModalOpen(true);
                          }}
                          className="flex items-center space-x-1"
                        >
                          <Star className="h-4 w-4" />
                          <span>Leave a Review</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings yet</p>
                    <Button onClick={handleNewBooking} variant="outline" className="mt-4">
                      Make Your First Booking
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Name</label>
                    <input 
                      type="text" 
                      defaultValue={userProfile?.full_name || ''} 
                      className="w-full p-2 border border-border rounded-lg bg-background"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Email</label>
                    <input 
                      type="email" 
                      defaultValue={userProfile?.email || ''} 
                      className="w-full p-2 border border-border rounded-lg bg-background"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Phone</label>
                    <input 
                      type="tel" 
                      defaultValue={userProfile?.phone || ''} 
                      className="w-full p-2 border border-border rounded-lg bg-background"
                      disabled
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={() => setProfileEditOpen(true)}>Edit Profile</Button>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Messages</h2>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-card-foreground">John Smith (Driver)</h3>
                    <span className="text-xs text-muted-foreground">2 min ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Hi! I'm on my way to pick you up.</p>
                  <Button size="sm" variant="outline" onClick={() => setMessagingOpen(true)}>
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Payment Information</h2>
              <div className="space-y-4">
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="font-semibold text-card-foreground mb-2">Payment Methods</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment is made directly to your driver. We accept all major credit cards, 
                    Apple Pay, Google Pay, Venmo, Zelle, and cash.
                  </p>
                </div>
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="font-semibold text-card-foreground mb-2">Payment Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment must be completed within 24 hours of driver acceptance to secure your booking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium text-card-foreground">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSettingsType("notifications");
                      setSettingsModalOpen(true);
                    }}
                  >
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium text-card-foreground">Privacy</h3>
                    <p className="text-sm text-muted-foreground">Control your privacy settings</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSettingsType("privacy");
                      setSettingsModalOpen(true);
                    }}
                  >
                    Manage
                  </Button>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button 
                    onClick={handleLogout}
                    variant="destructive" 
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <MessagingInterface 
          isOpen={messagingOpen}
          onClose={() => setMessagingOpen(false)}
          userType="passenger"
        />
        
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          type={settingsType}
        />

        <ProfileEditModal
          isOpen={profileEditOpen}
          onClose={() => setProfileEditOpen(false)}
        />

        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedBookingForReview(null);
          }}
          bookingId={selectedBookingForReview || ""}
        />

        {/* Welcome Celebration Modal */}
        <CelebrationModal
          isOpen={showWelcomeCelebration}
          onClose={() => setShowWelcomeCelebration(false)}
        />

        {/* Ride Confirmation Celebration */}
        <CelebrationModal
          isOpen={showRideConfirmation}
          onClose={() => setShowRideConfirmation(false)}
          title="🥂 Your ride has been confirmed!"
          message="Get ready for a premium experience. Your chauffeur will meet you at the agreed location."
          actionText="View Details"
          onAction={() => setShowRideConfirmation(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;