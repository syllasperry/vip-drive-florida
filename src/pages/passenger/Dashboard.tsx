import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessagingInterface } from "@/components/MessagingInterface";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import CelebrationModal from "@/components/CelebrationModal";
import { ReviewModal } from "@/components/ReviewModal";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { UpcomingRideCard } from "@/components/dashboard/UpcomingRideCard";
import { BookingToggle } from "@/components/dashboard/BookingToggle";
import { BookingCard } from "@/components/dashboard/BookingCard";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut } from "lucide-react";

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
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const [showRideConfirmation, setShowRideConfirmation] = useState(false);

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
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/");
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
    },
    {
      id: "4",
      date: "2024-01-10",
      time: "12:00",
      from: "Downtown Miami",
      to: "Miami Beach",
      vehicle: "Tesla Model S",
      status: "completed",
      driver: "Carlos Martinez",
      paymentMethod: "Credit Card",
      countdown: null
    }
  ]);

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

        {/* Next Upcoming Ride Card */}
        {nextRide && activeTab === "bookings" && (
          <UpcomingRideCard 
            ride={nextRide}
            userType="passenger"
            onMessage={() => setMessagingOpen(true)}
          />
        )}

        {/* Tab Content */}
        {activeTab === "bookings" && (
          <div>
            <BookingToggle 
              activeView={bookingView}
              onViewChange={setBookingView}
            />
            
            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {bookingView === "upcoming" ? "No upcoming rides" : "No past rides"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <BookingCard 
                    key={booking.id}
                    booking={booking}
                    userType="passenger"
                    onMessage={() => setMessagingOpen(true)}
                    onReview={() => {
                      setSelectedBookingForReview(booking.id);
                      setReviewModalOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No messages yet.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Manage your payment methods here.</p>
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
                    <h3 className="font-semibold text-foreground">Profile Settings</h3>
                    <p className="text-sm text-muted-foreground">Update your personal information</p>
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
        userProfile={userProfile}
        onPhotoUpload={handlePhotoUpload}
      />

      <ReviewModal 
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        bookingId={selectedBookingForReview}
      />

      <CelebrationModal 
        isOpen={showWelcomeCelebration}
        onClose={() => setShowWelcomeCelebration(false)}
      />

      <CelebrationModal 
        isOpen={showRideConfirmation}
        onClose={() => setShowRideConfirmation(false)}
      />
    </div>
  );
};

export default Dashboard;