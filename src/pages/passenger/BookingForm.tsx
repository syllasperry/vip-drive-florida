
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, MapPin, Users, Car } from "lucide-react";
import { MinimalDateTimePicker } from "@/components/MinimalDateTimePicker";
import { SecureGoogleMapsAutocomplete } from "@/components/SecureGoogleMapsAutocomplete";

const BookingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    pickup_location: "",
    dropoff_location: "",
    pickup_time: "",
    passenger_count: 1,
    vehicle_type: "Tesla Model Y",
    additional_notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState(null);

  useEffect(() => {
    loadPassengerInfo();
  }, []);

  const loadPassengerInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setPassengerInfo(data);
    } catch (error) {
      console.error('Error loading passenger info:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pickup_location || !formData.dropoff_location || !formData.pickup_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      console.log('🚀 CREATING BOOKING REQUEST with enhanced sync...');
      
      // CRITICAL: Create booking with initial 'pending' status for dispatcher visibility
      const bookingData = {
        passenger_id: user.id,
        pickup_location: formData.pickup_location,
        dropoff_location: formData.dropoff_location,
        pickup_time: formData.pickup_time,
        passenger_count: formData.passenger_count,
        vehicle_type: formData.vehicle_type,
        status: 'pending', // CRITICAL: Must match dispatcher query expectations
        ride_status: 'pending_driver',
        payment_confirmation_status: 'waiting_for_offer',
        status_passenger: 'passenger_requested',
        status_driver: 'new_request',
        driver_id: null, // CRITICAL: Start as null for dispatcher to see
        final_price: null, // CRITICAL: Start as null - "Awaiting price"
        estimated_price: null
      };

      console.log('📋 BOOKING DATA BEING INSERTED:', bookingData);

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select('*')
        .single();

      if (error) {
        console.error('❌ CRITICAL ERROR creating booking:', error);
        throw error;
      }

      console.log('✅ BOOKING CREATED SUCCESSFULLY:', data);
      console.log('🎯 Booking ID for dispatcher:', data.id.slice(-8).toUpperCase());

      toast({
        title: "Booking Request Submitted",
        description: `Your booking request #${data.id.slice(-8).toUpperCase()} has been created successfully!`,
      });

      // Navigate back to dashboard to see the booking
      navigate('/passenger/dashboard');

    } catch (error) {
      console.error('❌ CRITICAL ERROR in booking submission:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
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
              onClick={() => navigate('/passenger/dashboard')}
              className="p-0 h-auto mr-4 text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">New Booking</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pickup Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                Pickup Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecureGoogleMapsAutocomplete
                placeholder="Enter pickup address"
                value={formData.pickup_location}
                onChange={(value) => handleInputChange('pickup_location', value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Dropoff Location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                Drop-off Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecureGoogleMapsAutocomplete
                placeholder="Enter destination address"
                value={formData.dropoff_location}
                onChange={(value) => handleInputChange('dropoff_location', value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-3 text-gray-600" />
                Pickup Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MinimalDateTimePicker
                value={formData.pickup_time}
                onChange={(value) => handleInputChange('pickup_time', value)}
              />
            </CardContent>
          </Card>

          {/* Passenger Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Users className="w-5 h-5 mr-3 text-gray-600" />
                Number of Passengers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={formData.passenger_count}
                onChange={(e) => handleInputChange('passenger_count', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Vehicle Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Car className="w-5 h-5 mr-3 text-gray-600" />
                Vehicle Preference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={formData.vehicle_type}
                onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="Tesla Model Y">Tesla Model Y</option>
                <option value="Tesla Model S">Tesla Model S</option>
                <option value="Tesla Model X">Tesla Model X</option>
                <option value="BMW 7 Series">BMW 7 Series</option>
                <option value="Mercedes S-Class">Mercedes S-Class</option>
                <option value="Audi A8">Audi A8</option>
              </select>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any special requests or additional information..."
                value={formData.additional_notes}
                onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-medium"
          >
            {isSubmitting ? "Creating Booking..." : "Submit Booking Request"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
