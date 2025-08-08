import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const HomeScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // Check if user is dispatcher
        if (user.email === 'syllasperry@gmail.com') {
          navigate('/dispatcher/dashboard');
          return;
        }
        
        // Otherwise, redirect to passenger dashboard
        navigate('/passenger/dashboard');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <img 
              src="/lovable-uploads/vip-logo.jpg" 
              alt="VIP Service" 
              className="h-24 mx-auto mb-8 rounded-lg shadow-lg"
            />
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              VIP Chauffeur Service
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Experience luxury transportation with our premium chauffeur service. 
              Professional, reliable, and comfortable rides for all your needs.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Button 
                variant="luxury" 
                size="lg" 
                className="h-16 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate('/passenger/price-estimate')}
              >
                Book Your Ride
                <span className="block text-sm font-normal opacity-90">Get started now</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="h-16 text-lg font-medium border-2 hover:bg-muted transition-all duration-300"
                onClick={() => navigate('/passenger/login')}
              >
                Passenger Login
                <span className="block text-sm font-normal opacity-70">Access your account</span>
              </Button>
            </div>

            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Need assistance? Contact our customer service team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
