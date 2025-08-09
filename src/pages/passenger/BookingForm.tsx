
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/DateTimePicker";
import GoogleMapsAutocomplete from "@/components/GoogleMapsAutocomplete";
import { ArrowLeft, MapPin, Clock, Users, Car } from "lucide-react";

interface VehicleType {
  id: string;
  vehicle_name: string;
  code_name: string;
  make: string;
  model: string;
}

const BookingForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupTime, setPickupTime] = useState<Date | undefined>(new Date());
  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadVehicleTypes();
    
    // Get pre-selected vehicle from URL params
    const vehicleParam = searchParams.get('vehicle');
    if (vehicleParam) {
      const decodedVehicle = JSON.parse(decodeURIComponent(vehicleParam));
      setSelectedVehicle(decodedVehicle);
    }
  }, [searchParams]);

  const loadVehicleTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .order('vehicle_name');

      if (error) throw error;
      setVehicleTypes(data || []);
    } catch (error) {
      console.error('Error loading vehicle types:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicle options",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!pickupLocation || !dropoffLocation || !pickupTime || !selectedVehicle) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📝 Creating booking request - NO automatic driver assignment');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      // Create booking with NO driver assignment - dispatcher will handle manually
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          passenger_id: user.id,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          pickup_time: pickupTime.toISOString(),
          passenger_count: passengerCount,
          vehicle_type: `${selectedVehicle.make} ${selectedVehicle.model}`,
          status: 'pending',
          ride_status: 'pending_dispatcher_assignment',
          payment_confirmation_status: 'awaiting_dispatcher',
          status_passenger: 'passenger_requested',
          status_driver: 'awaiting_assignment',
          // CRITICAL: NO automatic driver assignment whatsoever
          driver_id: null,
          vehicle_id: null
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Booking created successfully - awaiting dispatcher assignment:', data);

      toast({
        title: "Booking Requested!",
        description: "Your ride request has been submitted. Our dispatch team will assign a driver shortly and send you an offer.",
      });

      navigate(`/passenger/confirmation?booking=${data.id}`);
      
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-0 h-auto text-gray-600 mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Book Your Ride</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pickup Location */}
            <div>
              <Label htmlFor="pickup" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span>Pickup Location</span>
              </Label>
              <GoogleMapsAutocomplete
                onPlaceSelected={(place) => setPickupLocation(place)}
                placeholder="Enter pickup address"
                className="mt-1"
              />
            </div>

            {/* Dropoff Location */}
            <div>
              <Label htmlFor="dropoff" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span>Drop-off Location</span>
              </Label>
              <GoogleMapsAutocomplete
                onPlaceSelected={(place) => setDropoffLocation(place)}
                placeholder="Enter destination address"
                className="mt-1"
              />
            </div>

            {/* Pickup Time */}
            <div>
              <Label className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Pickup Time</span>
              </Label>
              <DateTimePicker 
                value={pickupTime} 
                onChange={setPickupTime}
                className="mt-1"
              />
            </div>

            {/* Passenger Count */}
            <div>
              <Label htmlFor="passengers" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Number of Passengers</span>
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="8"
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>

            {/* Selected Vehicle */}
            {selectedVehicle && (
              <div>
                <Label className="flex items-center space-x-2">
                  <Car className="h-4 w-4" />
                  <span>Selected Vehicle</span>
                </Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedVehicle.vehicle_name}</p>
                  <p className="text-sm text-gray-600">{selectedVehicle.make} {selectedVehicle.model}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/passenger/choose-vehicle')}
                  className="mt-2 w-full"
                >
                  Change Vehicle
                </Button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !pickupLocation || !dropoffLocation || !selectedVehicle}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium"
            >
              {isSubmitting ? "Creating Booking..." : "Request Ride"}
            </Button>

            {/* Info Note */}
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
              <p><strong>Note:</strong> Your vehicle preference is noted, but our dispatch team will assign the most suitable available driver for your trip and send you a personalized offer.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingForm;
