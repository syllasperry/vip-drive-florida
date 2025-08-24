
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/DateTimePicker";
import { ArrowLeft, Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { format, addHours } from 'date-fns';

const BookingForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { pickup, dropoff, estimatedPrice, selectedVehicle } = location.state || {};
  
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(addHours(new Date(), 6));
  const [passengerCount, setPassengerCount] = useState(1);
  const [luggageCount, setLuggageCount] = useState(0);
  const [flightInfo, setFlightInfo] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (!pickup || !dropoff || !selectedVehicle) {
      navigate('/estimate');
    }
  }, [pickup, dropoff, selectedVehicle, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const bookingData = {
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      selectedDateTime,
      vehicleType: selectedVehicle?.name,
      passengerCount,
      luggageCount,
      flightInfo,
      specialRequests,
      contactName,
      contactPhone,
      contactEmail,
      estimatedPrice
    };

    navigate('/passenger/confirmation', { state: bookingData });
  };

  if (!pickup || !dropoff || !selectedVehicle) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vehicle Selection
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">Please provide the details for your ride</p>
        </div>

        {/* Trip Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Trip Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-gray-900">From:</p>
              <p className="text-gray-600">{pickup}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">To:</p>
              <p className="text-gray-600">{dropoff}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Vehicle:</p>
              <p className="text-gray-600">{selectedVehicle?.name}</p>
            </div>
            {estimatedPrice && (
              <div>
                <p className="font-medium text-gray-900">Estimated Price:</p>
                <p className="text-gray-600">{estimatedPrice}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>When do you need your ride?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DateTimePicker
                date={selectedDateTime}
                setDate={setSelectedDateTime}
              />
              <p className="text-sm text-gray-500 mt-2">
                Selected: {format(selectedDateTime, 'MMM d, yyyy \'at\' h:mm a')}
              </p>
            </CardContent>
          </Card>

          {/* Passenger Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Passenger Details</span>
              </CardTitle>
            </CardContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passengerCount">Number of Passengers</Label>
                  <Input
                    id="passengerCount"
                    type="number"
                    min="1"
                    max="8"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="luggageCount">Number of Bags</Label>
                  <Input
                    id="luggageCount"
                    type="number"
                    min="0"
                    max="10"
                    value={luggageCount}
                    onChange={(e) => setLuggageCount(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Primary contact for this trip"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span>Additional Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flightInfo">Flight Information (optional)</Label>
                <Input
                  id="flightInfo"
                  value={flightInfo}
                  onChange={(e) => setFlightInfo(e.target.value)}
                  placeholder="AA 1234, Delta 5678, etc."
                />
                <p className="text-sm text-gray-500">
                  Include airline and flight number for airport pickups
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests (optional)</Label>
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests or notes for your driver..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
              Continue to Confirmation
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            All rides must be booked at least 6 hours in advance
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
