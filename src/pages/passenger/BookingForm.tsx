import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Users, Luggage, Plane, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/DateTimePicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pickup, dropoff, selectedVehicle } = location.state || {};
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Auto-scroll to top when this page loads
  useScrollToTop();

  const [formData, setFormData] = useState({
    flightInfo: "",
    date: "",
    time: "",
    passengers: "1",
    luggage: "1",
    luggageSize: "medium",
    notes: "",
    bookingForOther: false,
    otherPersonName: "",
    otherPersonPhone: "",
    otherPersonEmail: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to create a booking.",
          variant: "destructive",
        });
        navigate("/passenger/login");
        return;
      }

      // Combine date and time for pickup_time - parse safely without timezone issues
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      const pickupDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      // Validate 6-hour minimum notice
      const now = new Date();
      const minBookingTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // 6 hours from now
      
      if (pickupDateTime <= minBookingTime) {
        toast({
          title: "Invalid Booking Time",
          description: "Please select a time at least 6 hours from now.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get vehicle details from the selected vehicle
      const vehicleMapping = {
        'tesla-y': { make: 'Tesla', model: 'Model Y' },
        'bmw-sedan': { make: 'BMW', model: '5 Series' },
        'chevrolet-suv': { make: 'Chevrolet', model: 'Tahoe' },
        'mercedes-van': { make: 'Mercedes-Benz', model: 'Sprinter' }
      };

      const vehicleInfo = vehicleMapping[selectedVehicle?.id as keyof typeof vehicleMapping];
      if (!vehicleInfo) {
        throw new Error('Invalid vehicle selection');
      }

      // Find matching drivers based only on car_make
      const { data: matchingDrivers, error: matchError } = await supabase
        .from('drivers')
        .select('id, full_name, email, phone, car_make')
        .ilike('car_make', `%${vehicleInfo.make}%`)
        .not('car_make', 'is', null);

      if (matchError) {
        console.error('Error finding matching drivers:', matchError);
        throw new Error('Failed to find matching drivers');
      }

      if (!matchingDrivers || matchingDrivers.length === 0) {
        toast({
          title: "No Available Drivers",
          description: `No drivers with ${vehicleInfo.make} ${vehicleInfo.model} are currently available.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Don't assign driver immediately - send request to drivers first

      // Get passenger data to denormalize into booking
      const { data: passengerData, error: passengerError } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (passengerError) {
        console.error('Error fetching passenger data:', passengerError);
        throw new Error('Please complete your passenger profile before booking');
      }

      if (!passengerData) {
        toast({
          title: "Profile Incomplete",
          description: "Please complete your passenger profile before booking.",
          variant: "destructive",
        });
        setLoading(false);
        navigate("/passenger/dashboard");
        return;
      }

      // Create booking request in database WITHOUT driver assigned yet
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          passenger_id: session.user.id,
          driver_id: null, // No driver assigned yet - this is a request
          pickup_location: pickup,
          dropoff_location: dropoff,
          pickup_time: pickupDateTime.toISOString(),
          passenger_count: parseInt(formData.passengers),
          luggage_count: parseInt(formData.luggage),
          flight_info: formData.flightInfo || '',
          vehicle_type: `${vehicleInfo.make} ${vehicleInfo.model}`,
          ride_status: 'pending_driver',
          payment_confirmation_status: 'waiting_for_offer',
          status: 'pending',
          payment_status: 'pending',
          status_passenger: 'passenger_requested',
          status_driver: 'new_request',
          // Denormalized passenger data
          passenger_first_name: passengerData.full_name?.split(' ')[0] || '',
          passenger_last_name: passengerData.full_name?.split(' ').slice(1).join(' ') || '',
          passenger_phone: passengerData.phone || '',
          passenger_photo_url: passengerData.profile_photo_url || '',
          passenger_preferences: {
            temperature: passengerData.preferred_temperature,
            music: passengerData.music_preference,
            interaction: passengerData.interaction_preference,
            trip_purpose: passengerData.trip_purpose,
            notes: passengerData.additional_notes
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Send booking request notification to all matching drivers
      try {
        await supabase.functions.invoke('send-booking-notifications', {
          body: {
            bookingId: booking.id,
            status: 'pending_driver',
            triggerType: 'new_booking_request',
            matchingDrivers: matchingDrivers.map(d => d.id)
          }
        });
      } catch (emailError) {
        console.error('Failed to send booking request notifications:', emailError);
        // Don't fail the booking creation if email fails
      }

      toast({
        title: "Booking request sent!",
        description: `Your request has been sent to ${matchingDrivers.length} available driver(s). You'll be notified when a driver responds.`,
      });

      // Navigate to confirmation page
      navigate("/passenger/confirmation", {
        state: {
          pickup,
          dropoff,
          selectedVehicle,
          bookingDetails: formData,
          bookingId: booking.id
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGoBack = () => {
    navigate("/passenger/choose-vehicle", { 
      state: { pickup, dropoff } 
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Go Back button */}
        <div className="flex justify-start mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Booking</h1>
          <p className="text-muted-foreground">Fill in the details for your ride</p>
        </div>

        {selectedVehicle && (
          <div className="bg-card rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <img 
                src={selectedVehicle.image} 
                alt={selectedVehicle.name}
                className="w-20 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-bold text-card-foreground">{selectedVehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedVehicle.description}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-card-foreground flex items-center">
              <Plane className="mr-2 h-5 w-5 text-primary" />
              Trip Details
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="flightInfo" className="text-card-foreground">
                  Flight Information (Optional)
                </Label>
                <Input
                  id="flightInfo"
                  placeholder="e.g., AA123 arriving at 3:00 PM"
                  value={formData.flightInfo}
                  onChange={(e) => handleInputChange("flightInfo", e.target.value)}
                  className="mt-1"
                />
              </div>

              <DateTimePicker
                selectedDate={formData.date}
                selectedTime={formData.time}
                onDateChange={(date) => handleInputChange("date", date)}
                onTimeChange={(time) => handleInputChange("time", time)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passengers" className="text-card-foreground flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    Passengers
                  </Label>
                  <Select value={formData.passengers} onValueChange={(value) => handleInputChange("passengers", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="luggage" className="text-card-foreground flex items-center">
                    <Luggage className="mr-1 h-4 w-4" />
                    Luggage Count
                  </Label>
                  <Select value={formData.luggage} onValueChange={(value) => handleInputChange("luggage", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0,1,2,3,4,5,6,7,8].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="luggageSize" className="text-card-foreground">
                  Luggage Size
                </Label>
                <Select value={formData.luggageSize} onValueChange={(value) => handleInputChange("luggageSize", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (carry-on)</SelectItem>
                    <SelectItem value="medium">Medium (standard)</SelectItem>
                    <SelectItem value="large">Large (oversized)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-card-foreground">
                  Special Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="bookingForOther" className="text-card-foreground font-medium">
                Booking for another person?
              </Label>
              <Switch
                id="bookingForOther"
                checked={formData.bookingForOther}
                onCheckedChange={(checked) => handleInputChange("bookingForOther", checked)}
              />
            </div>

            {formData.bookingForOther && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <Label htmlFor="otherPersonName" className="text-card-foreground">
                    Passenger Name
                  </Label>
                  <Input
                    id="otherPersonName"
                    placeholder="Full name of the passenger"
                    value={formData.otherPersonName}
                    onChange={(e) => handleInputChange("otherPersonName", e.target.value)}
                    className="mt-1"
                    required={formData.bookingForOther}
                  />
                </div>
                <div>
                  <Label htmlFor="otherPersonPhone" className="text-card-foreground">
                    Passenger Phone
                  </Label>
                  <Input
                    id="otherPersonPhone"
                    placeholder="Phone number"
                    value={formData.otherPersonPhone}
                    onChange={(e) => handleInputChange("otherPersonPhone", e.target.value)}
                    className="mt-1"
                    required={formData.bookingForOther}
                  />
                </div>
                <div>
                  <Label htmlFor="otherPersonEmail" className="text-card-foreground">
                    Passenger Email
                  </Label>
                  <Input
                    id="otherPersonEmail"
                    type="email"
                    placeholder="Email address"
                    value={formData.otherPersonEmail}
                    onChange={(e) => handleInputChange("otherPersonEmail", e.target.value)}
                    className="mt-1"
                    required={formData.bookingForOther}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="luxury"
            size="lg"
            className="w-full"
            disabled={loading || !formData.date || !formData.time}
          >
            {loading ? "Creating Booking..." : "Submit Booking Request"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Your booking request will be sent to available drivers
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;