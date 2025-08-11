
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Calendar, Users, MessageSquare } from 'lucide-react';
import { SecureGoogleMapsAutocomplete } from '@/components/SecureGoogleMapsAutocomplete';
import { MinimalDateTimePicker } from '@/components/MinimalDateTimePicker';
import { validateInput, validateLocationInput, validatePassengerCount, validatePickupTime } from '@/utils/inputValidation';
import { useToast } from '@/hooks/use-toast';

const BookingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupTime, setPickupTime] = useState(new Date());
  const [passengerCount, setPassengerCount] = useState('1');
  const [luggage, setLuggage] = useState('none');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs using the validation functions
    const pickupValidation = validateLocationInput(pickupLocation);
    const dropoffValidation = validateLocationInput(dropoffLocation);
    const passengerValidation = validatePassengerCount(parseInt(passengerCount));
    const timeValidation = validatePickupTime(pickupTime);
    
    if (!pickupValidation.isValid) {
      toast({
        title: "Invalid Pickup Location",
        description: pickupValidation.error,
        variant: "destructive",
      });
      return;
    }

    if (!dropoffValidation.isValid) {
      toast({
        title: "Invalid Dropoff Location", 
        description: dropoffValidation.error,
        variant: "destructive",
      });
      return;
    }

    if (!passengerValidation.isValid) {
      toast({
        title: "Invalid Passenger Count",
        description: passengerValidation.error,
        variant: "destructive",
      });
      return;
    }

    if (!timeValidation.isValid) {
      toast({
        title: "Invalid Pickup Time",
        description: timeValidation.error,
        variant: "destructive",
      });
      return;
    }

    if (specialRequests && !validateInput(specialRequests, 'text')) {
      toast({
        title: "Invalid Input",
        description: "Special requests contain invalid characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would submit the booking data
      console.log('Submitting booking:', {
        pickupLocation,
        dropoffLocation,
        pickupTime,
        passengerCount: parseInt(passengerCount),
        luggage,
        specialRequests
      });
      
      // Navigate to vehicle selection
      navigate('/passenger/choose-vehicle');
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">Book Your Ride</h1>
        </div>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Trip Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pickup Location */}
              <div className="space-y-2">
                <Label htmlFor="pickup">Pickup Location</Label>
                <SecureGoogleMapsAutocomplete
                  value={pickupLocation}
                  onSelect={setPickupLocation}
                  placeholder="Enter pickup address"
                  id="pickup"
                  required
                />
              </div>

              {/* Dropoff Location */}
              <div className="space-y-2">
                <Label htmlFor="dropoff">Dropoff Location</Label>
                <SecureGoogleMapsAutocomplete
                  value={dropoffLocation}
                  onSelect={setDropoffLocation}
                  placeholder="Enter destination address"
                  id="dropoff"
                  required
                />
              </div>

              {/* Date and Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="pickup-time">Pickup Date & Time</Label>
                <MinimalDateTimePicker
                  value={pickupTime}
                  onChange={setPickupTime}
                  className="w-full"
                />
              </div>

              {/* Passenger Count */}
              <div className="space-y-2">
                <Label htmlFor="passengers">Number of Passengers</Label>
                <Select value={passengerCount} onValueChange={setPassengerCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select passenger count" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} passenger{count !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Luggage */}
              <div className="space-y-2">
                <Label htmlFor="luggage">Luggage</Label>
                <Select value={luggage} onValueChange={setLuggage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select luggage amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No luggage</SelectItem>
                    <SelectItem value="light">Light luggage (1-2 bags)</SelectItem>
                    <SelectItem value="medium">Medium luggage (3-4 bags)</SelectItem>
                    <SelectItem value="heavy">Heavy luggage (5+ bags)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="special-requests">Special Requests</Label>
                <Textarea
                  id="special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requirements or requests..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Continue to Vehicle Selection'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingForm;
