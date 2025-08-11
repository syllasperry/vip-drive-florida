
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dispatcherInfo, setDispatcherInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/dispatcher/login');
        return;
      }

      // Check if user has dispatcher role using new role-based system
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'dispatcher')
        .single();

      if (roleError || !userRole) {
        console.log('🔒 Access denied: User does not have dispatcher role');
        navigate('/passenger/dashboard');
        return;
      }

      loadDispatcherInfo(user.id);
    } catch (error) {
      console.error('🔒 Auth error:', error);
      navigate('/dispatcher/login');
    }
  };

  const loadDispatcherInfo = async (userId: string) => {
    try {
      // Try to get from dispatchers table first
      const { data: dispatcherData, error: dispatcherError } = await supabase
        .from('dispatchers')
        .select('*')
        .eq('id', userId)
        .single();

      if (dispatcherData) {
        setDispatcherInfo(dispatcherData);
        return;
      }

      // Fallback to auth user data if not in dispatchers table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDispatcherInfo({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Dispatcher',
          email: user.email,
          phone: user.user_metadata?.phone,
          profile_photo_url: user.user_metadata?.avatar_url
        });
      }
    } catch (error) {
      console.error('Error loading dispatcher info:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile information",
        variant: "destructive",
      });
    }
  };

  const handleBookingUpdate = () => {
    console.log('🔄 Refreshing booking list after update...');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Navigate to different sections based on tab
    switch (tab) {
      case "rides":
        // Stay on current page but show rides view
        break;
      case "earnings":
        navigate('/dispatcher/earnings');
        break;
      case "messages":
        navigate('/dispatcher/messages');
        break;
      case "settings":
        navigate('/dispatcher/settings');
        break;
      default:
        // Dashboard view
        break;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "rides":
      case "dashboard":
      default:
        return (
          <>
            {/* Dispatcher Info Card */}
            {dispatcherInfo && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Welcome, {dispatcherInfo.full_name}!
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={dispatcherInfo.profile_photo_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {dispatcherInfo.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{dispatcherInfo.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Phone: {dispatcherInfo.phone || 'Not provided'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Management */}
            <div className="mb-6">
              <DispatcherBookingManager onUpdate={handleBookingUpdate} />
            </div>

            {/* Booking List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
              <DispatcherBookingList onManageBooking={handleBookingUpdate} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/50 sticky top-0 z-40 backdrop-blur-lg">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Dispatcher Hub</h1>
            <button
              onClick={() => navigate('/dispatcher/settings')}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-4 pb-20">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userType="dispatcher"
        pendingActionsCount={0}
        hasActiveRide={false}
      />
    </div>
  );
};

export default DispatcherDashboard;
