import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight, Info, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleMapsAutocomplete from "@/components/GoogleMapsAutocomplete";

const PriceEstimate = () => {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<string | null>(null);
  const navigate = useNavigate();
  
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
    navigate("/passenger/dashboard");
  };

  const calculateEstimate = () => {
    if (pickup && dropoff) {
      // Simple estimation logic - in real app this would call Google Distance Matrix API
      const basePrice = 75;
      const randomRange = Math.floor(Math.random() * 50) + 25;
      const estimate = `$${basePrice + randomRange} - $${basePrice + randomRange + 50}`;
      setEstimatedPrice(estimate);
    }
  };

  const handleContinue = () => {
    // Check if user is already logged in (in real app, this would check actual auth state)
    const isLoggedIn = localStorage.getItem("passenger_logged_in") === "true";
    
    if (isLoggedIn) {
      // If logged in, go directly to choose vehicle
      navigate("/passenger/choose-vehicle", { 
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
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
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
              <Label htmlFor="pickup" className="text-base font-medium">
                <MapPin className="inline h-4 w-4 mr-2" />
                Pickup Location
              </Label>
              <GoogleMapsAutocomplete
                id="pickup-location"
                placeholder="Pickup Location"
                value={pickup}
                onChange={(value) => setPickup(value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropoff" className="text-base font-medium">
                <MapPin className="inline h-4 w-4 mr-2" />
                Drop-off Location
              </Label>
              <GoogleMapsAutocomplete
                id="dropoff-location"
                placeholder="Drop-off Location"
                value={dropoff}
                onChange={(value) => setDropoff(value)}
                className="h-12"
              />
            </div>

            <Button 
              onClick={calculateEstimate}
              disabled={!pickup || !dropoff}
              className="w-full"
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
              
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>This is an estimate. Final price will be confirmed by your driver based on actual distance, time, and service requirements.</p>
              </div>

              <Button 
                onClick={handleContinue}
                variant="luxury"
                size="lg"
                className="w-full"
              >
                Continue to Book Your Ride
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Minimum booking: 48 hours in advance
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceEstimate;