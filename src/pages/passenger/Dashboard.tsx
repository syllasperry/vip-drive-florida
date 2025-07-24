// src/pages/passenger/Dashboard.tsx

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

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"notifications" | "privacy">("notifications");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<string | null>(null);
  const [showWelcomeCelebration, setShowWelcomeCelebration] = useState(false);
  const [showRideConfirmation, setShowRideConfirmation] = useState(false);

  // ✅ FUNÇÃO CORRIGIDA
  const handlePhotoUpload = async (file: File) => {
    if (!userProfile?.id) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image.",
        variant: "destructive",
      });
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${userProfile.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .update(filePath, file); // <-- update instead of upload with upsert

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
      .from("avatars")
      .getPublicUrl(filePath);

    const publicURL = publicURLData?.publicUrl;

    const { error: updateError } = await supabase
      .from("passengers")
      .update({ profile_photo_url: publicURL })
      .eq("id", userProfile.id);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl mx-auto p-4">
        {/* Avatar e Upload */}
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

        {/* ...continua com o restante do dashboard... */}
        
        {/* Todos os modals e componentes do final permanecem iguais */}

      </div>
    </div>
  );
};

export default Dashboard;