
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Users, MessageSquare } from 'lucide-react';
import { DateTimePicker } from '@/components/DateTimePicker';
import { validatePassengerCount, validatePickupTime } from '@/utils/inputValidation';
import { useToast } from '@/hooks/use-toast';

const BookingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [passengerCount, setPassengerCount] = useState('1');
  const [luggage, setLuggage] = useState('none');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passenger count
    const passengerValidation = validatePassengerCount(parseInt(passengerCount));
    if (!passengerValidation.isValid) {
      toast({
        title: "Invalid Passenger Count",
        description: passengerValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Validate date and time selection
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Invalid Date/Time",
        description: "Please select both date and time for your booking.",
        variant: "destructive",
      });
      return;
    }

    // Create pickup time from selected date and time
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const pickupTime = new Date(year, month - 1, day, hours, minutes);

    // Validate pickup time
    const timeValidation = validatePickupTime(pickupTime);
    if (!timeValidation.isValid) {
      toast({
        title: "Invalid Pickup Time",
        description: timeValidation.error,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting booking:', {
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
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Book Your Ride</h1>
          <div className="w-10" />
        </div>

        {/* Booking Form */}
        <div className="p-4">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pb-4">
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date and Time Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-medium text-card-foreground">
                    When do you need the ride?
                  </Label>
                  <DateTimePicker
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onDateChange={setSelectedDate}
                    onTimeChange={setSelectedTime}
                  />
                </div>

                {/* Passenger Count */}
                <div className="space-y-3">
                  <Label htmlFor="passengers" className="text-base font-medium text-card-foreground flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Number of Passengers
                  </Label>
                  <Select value={passengerCount} onValueChange={setPassengerCount}>
                    <SelectTrigger className="h-12">
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
                <div className="space-y-3">
                  <Label htmlFor="luggage" className="text-base font-medium text-card-foreground">
                    Luggage Requirements
                  </Label>
                  <Select value={luggage} onValueChange={setLuggage}>
                    <SelectTrigger className="h-12">
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
                <div className="space-y-3">
                  <Label htmlFor="special-requests" className="text-base font-medium text-card-foreground flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Special Requests
                  </Label>
                  <Textarea
                    id="special-requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requirements or requests..."
                    className="resize-none min-h-[100px]"
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Continue to Vehicle Selection'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
