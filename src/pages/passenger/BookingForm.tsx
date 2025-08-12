
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plane, Calendar, Users, Luggage, MessageSquare, User } from 'lucide-react';
import { DateTimePicker } from '@/components/DateTimePicker';
import { validatePassengerCount, validatePickupTime } from '@/utils/inputValidation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get data from previous page (vehicle selection)
  const { selectedVehicle, pickup, dropoff, estimatedPrice } = location.state || {};
  
  // Flight information
  const [flightType, setFlightType] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [showFlightInfo, setShowFlightInfo] = useState(false);
  
  // Date and time
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Booking details
  const [passengerCount, setPassengerCount] = useState('1');
  const [luggageSize, setLuggageSize] = useState('medium');
  const [luggageCount, setLuggageCount] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Third-party booking
  const [isThirdPartyBooking, setIsThirdPartyBooking] = useState(false);
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [thirdPartyPhone, setThirdPartyPhone] = useState('');
  const [thirdPartyEmail, setThirdPartyEmail] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to extract numeric price from price string
  const extractNumericPrice = (priceString: any): number => {
    if (!priceString) return 0;
    
    // Convert to string if it's not already
    const str = String(priceString);
    
    // Extract all numbers from the string
    const numbers = str.match(/\d+/g);
    
    if (!numbers || numbers.length === 0) return 0;
    
    // If it's a range like "$137 - $187", take the first number (base price)
    // If it's a single price like "$150", take that number
    return parseInt(numbers[0], 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Starting passenger booking submission process...');
    
    // Validate passenger count
    const passengerValidation = validatePassengerCount(parseInt(passengerCount));
    if (!passengerValidation.isValid) {
      console.error('❌ Passenger count validation failed:', passengerValidation.error);
      toast({
        title: "Invalid Passenger Count",
        description: passengerValidation.error,
        variant: "destructive",
      });
      return;
    }

    // Validate date and time selection
    if (!selectedDate || !selectedTime) {
      console.error('❌ Date/time validation failed:', { selectedDate, selectedTime });
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

    console.log('📅 Pickup time created:', pickupTime.toISOString());

    // Validate pickup time (6-hour minimum rule)
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    
    if (pickupTime < sixHoursFromNow) {
      console.error('❌ Pickup time validation failed - not 6 hours in advance');
      toast({
        title: "Invalid Pickup Time",
        description: "Bookings must be made at least 6 hours in advance.",
        variant: "destructive",
      });
      return;
    }

    // Validate third-party booking fields if enabled
    if (isThirdPartyBooking) {
      if (!thirdPartyName.trim() || !thirdPartyPhone.trim() || !thirdPartyEmail.trim()) {
        console.error('❌ Third-party booking validation failed');
        toast({
          title: "Missing Information",
          description: "Please fill in all fields for the third-party booking.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔐 Getting current user...');
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        throw new Error('User not authenticated');
      }

      console.log('✅ User authenticated:', user.id);

      // Create flight info string if provided
      let flightInfoString = '';
      if (showFlightInfo && flightType && flightNumber) {
        flightInfoString = `${flightType}: ${flightNumber}`;
      }

      // Prepare booking data WITHOUT driver_id (will be null until manually assigned)
      const bookingData = {
        passenger_id: user.id,
        pickup_location: pickup || 'Not specified',
        dropoff_location: dropoff || 'Not specified',
        pickup_time: pickupTime.toISOString(),
        passenger_count: parseInt(passengerCount),
        vehicle_type: selectedVehicle?.name || 'Standard Vehicle',
        estimated_price: null, // No automatic price - awaiting dispatcher
        final_price: null, // No automatic price - awaiting dispatcher offer
        status: 'pending', // Initial status - awaiting dispatcher review
        ride_status: 'pending_driver',
        payment_confirmation_status: 'waiting_for_offer',
        status_passenger: 'passenger_requested',
        status_driver: 'new_request',
        payment_status: 'pending',
        // IMPORTANT: driver_id is intentionally omitted - will be null in database
        // This ensures the driver_id_only_after_accept constraint is respected
        passenger_preferences: {
          luggage_size: luggageSize,
          luggage_count: parseInt(luggageCount),
          flight_info: flightInfoString,
          special_requests: specialRequests,
          // Store original price estimate as reference only (not used for payment)
          original_estimate_display: estimatedPrice,
          ...(isThirdPartyBooking && {
            third_party_booking: {
              name: thirdPartyName,
              phone: thirdPartyPhone,
              email: thirdPartyEmail
            }
          })
        }
      };

      console.log('📝 Passenger booking data prepared (NO driver_id):', {
        ...bookingData,
        passenger_preferences: JSON.stringify(bookingData.passenger_preferences, null, 2)
      });

      // Insert booking into database WITHOUT driver_id
      console.log('💾 Inserting passenger booking into database (driver_id will be null)...');
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Database insertion error:', bookingError);
        throw new Error(`Database error: ${bookingError.message}`);
      }

      if (!booking) {
        console.error('❌ No booking data returned from database');
        throw new Error('No booking data returned from database');
      }

      console.log('✅ Passenger booking created successfully (driver_id is null):', booking);

      // Success - navigate to confirmation page with booking data
      toast({
        title: "Booking Created!",
        description: "Your booking request has been submitted successfully. Awaiting assignment from our team.",
      });

      console.log('🧭 Navigating to confirmation page...');
      navigate('/passenger/confirmation', { 
        state: { 
          selectedVehicle,
          pickup,
          dropoff,
          estimatedPrice: null, // No price until dispatcher sets it
          pickupTime: pickupTime.toISOString(),
          passengerCount: parseInt(passengerCount),
          luggageSize,
          luggageCount: parseInt(luggageCount),
          specialRequests,
          flightInfo: showFlightInfo ? { type: flightType, number: flightNumber } : null,
          thirdPartyBooking: isThirdPartyBooking ? {
            name: thirdPartyName,
            phone: thirdPartyPhone,
            email: thirdPartyEmail
          } : null,
          bookingDetails: {
            date: selectedDate,
            time: selectedTime,
            passengers: passengerCount,
            bookingId: booking.id
          }
        } 
      });
    } catch (error) {
      console.error('❌ Error submitting passenger booking:', error);
      let errorMessage = "Failed to submit booking. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Error details:', error.message);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
          <h1 className="text-lg font-semibold">Complete Your Booking</h1>
          <div className="w-10" />
        </div>

        {/* Booking Form */}
        <div className="p-4 space-y-6">
          {/* Flight Information Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                  <Plane className="mr-2 h-5 w-5 text-primary" />
                  Flight Information
                </CardTitle>
                <Switch
                  checked={showFlightInfo}
                  onCheckedChange={setShowFlightInfo}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Optional: Help us coordinate your pickup with real-time flight data
              </p>
            </CardHeader>
            {showFlightInfo && (
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Flight Type</Label>
                  <Select value={flightType} onValueChange={setFlightType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select flight type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrival">Arrival (picking up from airport)</SelectItem>
                      <SelectItem value="departure">Departure (dropping off at airport)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Flight Number</Label>
                  <Input
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g., AA123, UA456"
                    className="h-11"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Date and Time Selection */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                When do you need the ride?
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Bookings must be made at least 6 hours in advance
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <DateTimePicker
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
              />
            </CardContent>
          </Card>

          {/* Passenger Count */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label htmlFor="passengers" className="text-base font-medium text-card-foreground flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Number of Passengers
                </Label>
                <Select value={passengerCount} onValueChange={setPassengerCount}>
                  <SelectTrigger className="h-11">
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
            </CardContent>
          </Card>

          {/* Luggage Selection */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                <Luggage className="mr-2 h-5 w-5 text-primary" />
                Luggage Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Luggage Size</Label>
                <Select value={luggageSize} onValueChange={setLuggageSize}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select luggage size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carry-on">Carry-on only</SelectItem>
                    <SelectItem value="medium">Medium (standard suitcase)</SelectItem>
                    <SelectItem value="large">Large (oversized luggage)</SelectItem>
                    <SelectItem value="extra-large">Extra Large (multiple large bags)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Number of Bags</Label>
                <Select value={luggageCount} onValueChange={setLuggageCount}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select number of bags" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} bag{count !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Booking */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Booking for someone else?
                </CardTitle>
                <Switch
                  checked={isThirdPartyBooking}
                  onCheckedChange={setIsThirdPartyBooking}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enable this if you're booking a ride for another person
              </p>
            </CardHeader>
            {isThirdPartyBooking && (
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Passenger's Full Name</Label>
                  <Input
                    value={thirdPartyName}
                    onChange={(e) => setThirdPartyName(e.target.value)}
                    placeholder="Enter full name"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contact Phone</Label>
                  <Input
                    value={thirdPartyPhone}
                    onChange={(e) => setThirdPartyPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contact Email</Label>
                  <Input
                    value={thirdPartyEmail}
                    onChange={(e) => setThirdPartyEmail(e.target.value)}
                    placeholder="Enter email address"
                    type="email"
                    className="h-11"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Special Requests */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label htmlFor="special-requests" className="text-base font-medium text-card-foreground flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  Special Requests
                </Label>
                <Textarea
                  id="special-requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requirements, child seats, accessibility needs, etc..."
                  className="resize-none min-h-[100px]"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Confirm Booking Button */}
          <div className="pt-4 pb-8">
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
