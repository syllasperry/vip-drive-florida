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
        console.log('User found:', user.email);
        
        // Check if user is dispatcher - exact email match
        if (user.email === 'syllasperry@gmail.com') {
          console.log('Dispatcher detected, redirecting to dispatcher dashboard');
          navigate('/dispatcher/dashboard');
          return;
        }
        
        // Otherwise, redirect to passenger dashboard
        console.log('Regular user, redirecting to passenger dashboard');
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-10">
            {/* VIP Service Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 mx-auto shadow-lg">
              <div className="text-primary-foreground font-bold text-lg">VIP</div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              VIP Chauffeur Service
            </h1>
            <p className="text-base text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed px-4">
              Experience luxury transportation with our premium chauffeur service. 
              Professional, reliable, and comfortable rides for all your needs.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              variant="luxury" 
              size="lg" 
              className="w-full h-14 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/passenger/price-estimate')}
            >
              <div className="text-center">
                <div>Book Your Ride</div>
                <div className="text-sm font-normal opacity-90">Get started now</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-14 text-base font-medium border-2 hover:bg-muted transition-all duration-300"
              onClick={() => navigate('/passenger/login')}
            >
              <div className="text-center">
                <div>Passenger Login</div>
                <div className="text-sm font-normal opacity-70">Access your account</div>
              </div>
            </Button>

            <div className="pt-6 border-t border-border/50 mt-8">
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
