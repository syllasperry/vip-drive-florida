import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Car, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const HomeScreen = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          // Fetch user profile from passengers table
          const { data: passenger } = await supabase
            .from('passengers')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUserProfile(passenger);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const handleDashboardClick = () => {
    if (isAuthenticated) {
      navigate("/passenger/dashboard");
    } else {
      // If not logged in, redirect to login
      navigate("/passenger/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Enhanced Dashboard shortcut button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDashboardClick}
            className="text-muted-foreground hover:text-foreground text-lg"
          >
            {isAuthenticated ? (
              <>
                <Avatar className="w-8 h-8 mr-3 ring-2 ring-green-500/30">
                  <AvatarImage 
                    src={userProfile?.profile_photo_url || undefined} 
                    alt="User Profile" 
                  />
                  <AvatarFallback className="bg-green-100 text-green-700">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-green-500 font-medium">Online</span>
                <span className="ml-2">— Go to Dashboard</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5 mr-2" />
                <span className="text-muted-foreground">Offline</span>
                <span className="ml-2">— Go to Dashboard</span>
              </>
            )}
          </Button>
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Welcome to VIP</h1>
          <p className="text-lg text-muted-foreground">
            Choose your experience
          </p>
        </div>

        <div className="space-y-6">
          <Button
            variant="passenger"
            size="xl"
            onClick={() => navigate("/passenger/price-estimate")}
            className="w-full space-y-2 h-auto py-8 flex flex-col"
          >
            <Plane className="h-12 w-12" />
            <div className="space-y-1">
              <div className="text-xl font-bold">I'm a Passenger</div>
              <div className="text-sm opacity-90">Book your premium ride</div>
            </div>
          </Button>

          <Button
            variant="driver"
            size="xl"
            onClick={() => navigate("/driver/login")}
            className="w-full space-y-2 h-auto py-8 flex flex-col"
          >
            <Car className="h-12 w-12" />
            <div className="space-y-1">
              <div className="text-xl font-bold">I'm a Driver</div>
              <div className="text-sm opacity-90">Access your dashboard</div>
            </div>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Premium chauffeur service in South Florida
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;