import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Clock, Users, Car } from "lucide-react";
import { MinimalDateTimePicker } from "@/components/MinimalDateTimePicker";

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(location.search);
  const [formData, setFormData] = useState({
    pickup_location: searchParams.get('pickup') || '',
    dropoff_location: searchParams.get('dropoff') || '',
    pickup_time: searchParams.get('pickup_time') || '',
    passenger_count: parseInt(searchParams.get('passengers') || '1'),
    vehicle_type: searchParams.get('vehicle') || '',
    flight_info: '',
    luggage_count: 0,
    luggage_size: '',
    additional_notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/passenger/login');
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
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a booking",
          variant: "destructive",
        });
        navigate('/passenger/login');
        return;
      }

      console.log('🎯 Creating new booking with initial status "pending"...');
      
      // Create booking with correct initial status and NO price
      const bookingData = {
        passenger_id: user.id,
        pickup_location: formData.pickup_location,
        dropoff_location: formData.dropoff_location,
        pickup_time: formData.pickup_time,
        passenger_count: formData.passenger_count,
        vehicle_type: formData.vehicle_type,
        flight_info: formData.flight_info || '',
        luggage_count: formData.luggage_count || 0,
        luggage_size: formData.luggage_size || '',
        additional_notes: formData.additional_notes || '',
        // Pricing fields - keep as NULL until dispatcher sets them
        estimated_price: null,
        final_price: null,
        // Status fields - set to pending/booking_requested
        status: 'pending',
        ride_status: 'pending_driver',
        payment_confirmation_status: 'waiting_for_offer',
        status_passenger: 'passenger_requested',
        status_driver: 'new_request',
        // Driver assignment - leave null for dispatcher to assign
        driver_id: null,
        vehicle_id: null
      };

      console.log('📝 Booking data:', bookingData);

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('❌ Booking creation error:', error);
        throw error;
      }

      console.log('✅ Booking created successfully:', data);

      toast({
        title: "Booking Submitted Successfully",
        description: "Your ride request has been sent. A dispatcher will review and assign a driver shortly.",
      });

      // Redirect to dashboard to see the new booking
      navigate('/passenger/dashboard');
      
    } catch (error) {
      console.error('❌ Booking submission error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to submit your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-0 h-auto mr-4 text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Confirm Your Booking</h1>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-md mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Summary */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-medium">{formData.pickup_location}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Drop-off</p>
                    <p className="font-medium">{formData.dropoff_location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(formData.pickup_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{formData.passenger_count} passengers</span>
                  </div>
                  {formData.vehicle_type && (
                    <div className="flex items-center space-x-2 col-span-2">
                      <Car className="w-4 h-4" />
                      <span>{formData.vehicle_type}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="flight_info">Flight Information (Optional)</Label>
                  <Input
                    id="flight_info"
                    value={formData.flight_info}
                    onChange={(e) => handleInputChange('flight_info', e.target.value)}
                    placeholder="Flight number and airline"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="luggage_count">Luggage Count</Label>
                    <Input
                      id="luggage_count"
                      type="number"
                      min="0"
                      value={formData.luggage_count}
                      onChange={(e) => handleInputChange('luggage_count', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="luggage_size">Luggage Size</Label>
                    <Input
                      id="luggage_size"
                      value={formData.luggage_size}
                      onChange={(e) => handleInputChange('luggage_size', e.target.value)}
                      placeholder="Small, Medium, Large"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additional_notes">Additional Notes</Label>
                  <Textarea
                    id="additional_notes"
                    value={formData.additional_notes}
                    onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                    placeholder="Any special requests or instructions"
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-medium"
              >
                {isSubmitting ? "Submitting..." : "Submit Booking Request"}
              </Button>

              <p className="text-sm text-gray-500 text-center">
                Your booking will be reviewed by our dispatch team. You'll receive a price quote and driver assignment shortly.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingForm;
