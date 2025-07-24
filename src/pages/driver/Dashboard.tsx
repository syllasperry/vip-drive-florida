import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessagingInterface } from "@/components/MessagingInterface";
import { DriverScheduleModal } from "@/components/DriverScheduleModal";
import { DriverSettingsModal } from "@/components/DriverSettingsModal";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { UpcomingRideCard } from "@/components/dashboard/UpcomingRideCard";
import { BookingToggle } from "@/components/dashboard/BookingToggle";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car, DollarSign, User, LogOut, Clock, CheckCircle, Calendar, MessageCircle } from "lucide-react";

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
  const [isOnline, setIsOnline] = useState(true);
  
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
          .single();

        if (error) {
          console.error('Error fetching driver profile:', error);
          toast({
            title: "Error",
            description: "Failed to load driver profile",
            variant: "destructive",
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

  const handleAcceptRide = (rideId: string) => {
    setMockRides(prevRides => 
      prevRides.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: "waiting_payment", countdown: 24 }
          : ride
      )
    );
  };

  const handleDeclineRide = (rideId: string) => {
    setMockRides(prevRides => 
      prevRides.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: "declined" }
          : ride
      )
    );
  };

  const handleConfirmPaymentReceived = (rideId: string) => {
    setMockRides(prevRides => 
      prevRides.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: "confirmed" }
          : ride
      )
    );
  };

  const [mockRides, setMockRides] = useState([
    {
      id: "1",
      date: "2024-01-15",
      time: "14:30",
      from: "Miami International Airport",
      to: "Brickell City Centre",
      passenger: "Sarah Johnson",
      status: "confirmed",
      payment: "$85.00",
      paymentMethod: "Visa ending in 4532",
      countdown: null
    },
    {
      id: "2", 
      date: "2024-01-18",
      time: "09:00",
      from: "Fort Lauderdale Airport", 
      to: "Las Olas Boulevard",
      passenger: "Mike Chen",
      status: "payment_confirmed",
      payment: "$95.00",
      paymentMethod: "Zelle",
      countdown: 18 // hours remaining
    },
    {
      id: "3",
      date: "2024-01-20",
      time: "16:00",
      from: "Palm Beach Airport",
      to: "Worth Avenue",
      passenger: "Emma Davis",
      status: "pending",
      payment: "$120.00",
      paymentMethod: null,
      countdown: null
    },
    {
      id: "4",
      date: "2024-01-10",
      time: "12:00",
      from: "Downtown Miami",
      to: "Miami Beach",
      passenger: "Carlos Martinez",
      status: "completed",
      payment: "$75.00",
      paymentMethod: "Credit Card",
      countdown: null
    }
  ]);

  // Filter rides based on current view
  const filteredRides = mockRides.filter(ride => {
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
  const nextRide = mockRides.find(ride => {
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
        />

        {/* Next Upcoming Ride Card */}
        {nextRide && activeTab === "rides" && (
          <UpcomingRideCard 
            ride={nextRide}
            userType="driver"
            onMessage={() => setMessagingOpen(true)}
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
                  <Card key={ride.id} className="hover:shadow-[var(--shadow-subtle)] transition-all duration-300 border-border/50">
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
                        <Badge className={getStatusColor(ride.status)}>
                          {getStatusText(ride.status)}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">{ride.passenger}</span>
                          </div>
                          <div className="ml-auto">
                            <p className="text-lg font-semibold text-primary">{ride.payment}</p>
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
                          onClick={() => setMessagingOpen(true)}
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
                 onClick={() => setMessagingOpen(true)}>
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
                 onClick={() => setMessagingOpen(true)}>
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
        onClose={() => setMessagingOpen(false)}
        userType="driver"
      />
      
      <DriverScheduleModal 
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        isOnline={isOnline}
        onToggleOnline={setIsOnline}
      />
      
      <DriverSettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default DriverDashboard;