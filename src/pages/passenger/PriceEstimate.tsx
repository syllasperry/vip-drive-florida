import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PriceEstimate = () => {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<string | null>(null);
  const navigate = useNavigate();

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
    navigate("/passenger/login", { 
      state: { pickup, dropoff, estimatedPrice } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md mx-auto pt-8">
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
              <Input
                id="pickup"
                placeholder="Enter pickup address"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropoff" className="text-base font-medium">
                <MapPin className="inline h-4 w-4 mr-2" />
                Drop-off Location
              </Label>
              <Input
                id="dropoff"
                placeholder="Enter destination address"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
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