
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, Calendar, Users, ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GoogleMapsAutocomplete from "@/components/GoogleMapsAutocomplete";
import { MinimalDateTimePicker } from "@/components/MinimalDateTimePicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PriceEstimate = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [passengerCount, setPassengerCount] = useState("1");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check authentication and preserve booking state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          // Store current form state before redirecting to login
          const currentPath = location.pathname + location.search;
          const returnTo = encodeURIComponent(currentPath);
          navigate(`/passenger/login?returnTo=${returnTo}`, { 
            state: location.state 
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, [navigate, location]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("estimateDraft");
      if (raw) {
        const draft = JSON.parse(raw);
        if (!pickupLocation && draft?.pickup) setPickupLocation(draft.pickup);
        if (!dropoffLocation && draft?.dropoff) setDropoffLocation(draft.dropoff);
        localStorage.removeItem("estimateDraft");
      }
    } catch (error) {
      console.error("Error restoring draft:", error);
    }
  }, []);

  const handlePickupSelect = (value: string, placeDetails?: any) => {
    setPickupLocation(value);
    if (placeDetails?.geometry?.location) {
      setPickupCoordinates({
        lat: placeDetails.geometry.location.lat(),
        lng: placeDetails.geometry.location.lng(),
      });
    }
  };

  const handleDropoffSelect = (value: string, placeDetails?: any) => {
    setDropoffLocation(value);
    if (placeDetails?.geometry?.location) {
      setDropoffCoordinates({
        lat: placeDetails.geometry.location.lat(),
        lng: placeDetails.geometry.location.lng(),
      });
    }
  };

  const handleLoginShortcut = () => {
    // Save current form state
    const draft = {
      pickup: pickupLocation,
      dropoff: dropoffLocation,
    };
    try {
      localStorage.setItem("estimateDraft", JSON.stringify(draft));
    } catch (error) {
      console.error("Error saving draft:", error);
    }

    const returnTo = encodeURIComponent(location.pathname + location.search);
    navigate(`/passenger/login?returnTo=${returnTo}`);
  };

  const estimateRidePrice = async () => {
    if (!pickupCoordinates || !dropoffCoordinates || !selectedDateTime || !passengerCount) {
      toast({
        title: "Error",
        description: "Please fill in all the details to get an estimate.",
        variant: "destructive",
      });
      return;
    }

    setLoadingEstimate(true);
    // Mocked price estimate logic
    const basePrice = 20;
    const distanceFactor = 1.5;
    const passengerFactor = parseInt(passengerCount) * 0.5;
    const timeFactor = selectedDateTime.getHours() >= 22 || selectedDateTime.getHours() < 6 ? 2 : 1; // Night time
    
    // Calculate a "distance" between pickup and dropoff (mocked)
    const distance = Math.abs(pickupCoordinates.lat - dropoffCoordinates.lat) + Math.abs(pickupCoordinates.lng - dropoffCoordinates.lng);
    
    let calculatedPrice = basePrice + (distance * distanceFactor) + passengerFactor + timeFactor;
    
    // Ensure the price is not negative
    calculatedPrice = Math.max(calculatedPrice, basePrice);

    // Round to 2 decimal places
    setEstimatedPrice(parseFloat(calculatedPrice.toFixed(2)));
    setLoadingEstimate(false);
  };

  const proceedToChooseVehicle = () => {
    if (!pickupLocation || !dropoffLocation || !selectedDateTime || !passengerCount || !estimatedPrice) {
      toast({
        title: "Error",
        description: "Please estimate the ride price first.",
        variant: "destructive",
      });
      return;
    }

    navigate("/passenger/choose-vehicle", {
      state: {
        pickupLocation,
        dropoffLocation,
        pickupCoordinates,
        dropoffCoordinates,
        selectedDateTime,
        passengerCount,
        estimatedPrice,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/home")}
        className="text-muted-foreground hover:text-foreground text-base mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go Back
      </Button>

      <Card className="max-w-md mx-auto bg-card shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">
            Book Your Ride
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickup">
              <MapPin className="inline h-4 w-4 mr-2" />
              Pickup Location
            </Label>
            <GoogleMapsAutocomplete 
              value={pickupLocation}
              onChange={handlePickupSelect}
              id="pickup" 
            />
            {pickupLocation && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {pickupLocation}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoff">
              <MapPin className="inline h-4 w-4 mr-2" />
              Dropoff Location
            </Label>
            <GoogleMapsAutocomplete 
              value={dropoffLocation}
              onChange={handleDropoffSelect}
              id="dropoff" 
            />
            {dropoffLocation && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {dropoffLocation}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">
              <Calendar className="inline h-4 w-4 mr-2" />
              Date and Time
            </Label>
            <MinimalDateTimePicker
              value={selectedDateTime || new Date()}
              onChange={(date: Date) => setSelectedDateTime(date)}
            />
            {selectedDateTime && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {selectedDateTime.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passengers">
              <Users className="inline h-4 w-4 mr-2" />
              Number of Passengers
            </Label>
            <Select value={passengerCount} onValueChange={(value) => setPassengerCount(value)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select passenger count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Passenger</SelectItem>
                <SelectItem value="2">2 Passengers</SelectItem>
                <SelectItem value="3">3 Passengers</SelectItem>
                <SelectItem value="4">4 Passengers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="secondary"
            className="w-full h-11 flex items-center justify-center"
            onClick={estimateRidePrice}
            disabled={loadingEstimate}
          >
            {loadingEstimate ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Estimating Price...
              </div>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Estimate Ride Price
              </>
            )}
          </Button>

          {/* Login shortcut */}
          <p className="text-center mt-3">
            <button
              type="button"
              onClick={handleLoginShortcut}
              className="bg-transparent border-none text-muted-foreground text-sm underline cursor-pointer hover:text-foreground transition-colors"
              aria-label="Log in"
            >
              Already have an account? Log in
            </button>
          </p>

          {estimatedPrice !== null && (
            <div className="text-center mt-4">
              <h3 className="text-lg font-semibold text-foreground">
                Estimated Price:
              </h3>
              <p className="text-2xl font-bold text-primary">
                ${estimatedPrice}
              </p>
            </div>
          )}

          <Button
            variant="luxury"
            className="w-full h-12"
            onClick={proceedToChooseVehicle}
            disabled={estimatedPrice === null}
          >
            Choose Vehicle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceEstimate;
