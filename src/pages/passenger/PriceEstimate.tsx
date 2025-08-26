
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { MapPin, ArrowRight, Info, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecureGoogleMapsAutocomplete } from "@/components/SecureGoogleMapsAutocomplete";

const PriceEstimate = () => {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Auto-scroll to top when this page loads
  useScrollToTop();
  
  // Check if user is logged in
  const isPassengerLoggedIn = localStorage.getItem("passenger_logged_in") === "true";
  const isDriverLoggedIn = localStorage.getItem("driver_logged_in") === "true";
  
  const handleDashboardClick = () => {
    if (isPassengerLoggedIn) {
      navigate("/passenger/dashboard");
    } else if (isDriverLoggedIn) {
      navigate("/driver/dashboard");
    } else {
      navigate("/passenger/login");
    }
  };

  const handleGoBack = () => {
    navigate("/onboarding");
  };

  const handleLoginClick = () => {
    navigate("/passenger/login");
  };

  const calculateEstimate = () => {
    // Only require non-empty fields, allow manual input
    if (!pickup.trim() || !dropoff.trim()) {
      return;
    }
    
    // Uber Premier base + 30% markup + Stripe gross-up calculation
    const basePrice = 75; // Uber Premier base
    const markup = basePrice * 0.30; // 30% markup (20% dispatcher + 10% app)
    const withMarkup = basePrice + markup;
    
    // Stripe gross-up (passenger pays Stripe fees)
    const stripePercentage = 0.029; // 2.9%
    const stripeFixed = 0.30; // $0.30
    const stripeFees = (withMarkup * stripePercentage) + stripeFixed;
    const finalPrice = withMarkup + stripeFees;
    
    // Add some randomization for distance-based pricing
    const randomRange = Math.floor(Math.random() * 50) + 25;
    const estimate = `$${Math.round(finalPrice + randomRange)}`;
    setEstimatedPrice(estimate);
    
    console.log('💰 Price calculated for route:', { 
      pickup, 
      dropoff, 
      basePrice, 
      markup, 
      withMarkup, 
      stripeFees, 
      finalPrice: finalPrice + randomRange,
      estimate 
    });
  };

  const handleContinue = () => {
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem("passenger_logged_in") === "true";
    
    if (isLoggedIn) {
      // If logged in, go directly to choose vehicle
      navigate("/cars", { 
        state: { pickup, dropoff, estimatedPrice } 
      });
    } else {
      // If not logged in, go to login first
      navigate("/passenger/login", { 
        state: { pickup, dropoff, estimatedPrice } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Go Back and Dashboard buttons */}
        <div className="flex justify-between items-center mb-4 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <button
            onClick={handleLoginClick}
            className="absolute top-0 right-0 text-sm text-muted-foreground hover:text-foreground hover:underline bg-transparent border-none cursor-pointer"
          >
            Log in
          </button>
          
          {(isPassengerLoggedIn || isDriverLoggedIn) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDashboardClick}
              className="text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          )}
        </div>
        
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Get Price Estimate</h1>
          <p className="text-muted-foreground">Plan your premium journey</p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pickup" className="text-base font-medium flex items-center">
                <MapPin className="inline h-4 w-4 mr-2" />
                Pickup Location
              </label>
              <SecureGoogleMapsAutocomplete
                value={pickup}
                onChange={(value) => setPickup(value)}
                placeholder="Enter pickup location (e.g., MIA, Fort Lauderdale Airport)"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dropoff" className="text-base font-medium flex items-center">
                <MapPin className="inline h-4 w-4 mr-2" />
                Drop-off Location
              </label>
              <SecureGoogleMapsAutocomplete
                value={dropoff}
                onChange={(value) => setDropoff(value)}
                placeholder="Enter destination (e.g., Miami, 2911 NE 10th Ter)"
              />
            </div>

            <Button 
              onClick={calculateEstimate}
              disabled={!pickup.trim() || !dropoff.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              Calculate Estimate
            </Button>
          </div>

          {estimatedPrice && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 animate-slide-up">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">Estimated Price</h3>
                <p className="text-3xl font-bold text-primary mt-2">{estimatedPrice}</p>
              </div>
              
              {/* Vehicle Categories */}
              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-sm text-muted-foreground">Available Categories:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <span>Tesla Model Y</span>
                    <span className="font-bold">${Math.round(parseInt(estimatedPrice.replace('$', '')) * 0.9)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <span>Premium Sedan</span>
                    <span className="font-bold">{estimatedPrice}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <span>Luxury SUV</span>
                    <span className="font-bold">${Math.round(parseInt(estimatedPrice.replace('$', '')) * 1.2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-background rounded">
                    <span>Executive Van</span>
                    <span className="font-bold">${Math.round(parseInt(estimatedPrice.replace('$', '')) * 1.5)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Final price confirmed by your driver based on actual distance, time, and service requirements.</p>
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
              >
                Start Booking
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Minimum booking: 6 hours in advance
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceEstimate;
