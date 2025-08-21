
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Users, Luggage, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingCreation } from '@/hooks/useBookingCreation';

const Confirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createBooking, isCreating } = useBookingCreation();
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const {
    pickupLocation,
    dropoffLocation,
    selectedDateTime,
    vehicleType,
    passengerCount,
    luggageCount,
    flightInfo,
    specialRequests
  } = location.state || {};

  useEffect(() => {
    if (!pickupLocation || !dropoffLocation || !selectedDateTime) {
      navigate('/passenger/booking-form');
    }
  }, [pickupLocation, dropoffLocation, selectedDateTime, navigate]);

  const handleConfirmBooking = async () => {
    if (bookingSubmitted) return;
    
    try {
      setBookingSubmitted(true);
      
      const bookingData = {
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_time: selectedDateTime,
        vehicle_type: vehicleType || 'Premium Sedan',
        passenger_count: passengerCount || 1,
        luggage_count: luggageCount || 0,
        flight_info: flightInfo || ''
      };

      await createBooking(bookingData);
      
    } catch (error) {
      console.error('Booking confirmation failed:', error);
      setBookingSubmitted(false);
    }
  };

  if (!pickupLocation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Booking</h1>
          <p className="text-gray-600">Please review your trip details before confirming</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Trip Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Location</p>
                  <p className="text-gray-600 text-sm">{pickupLocation}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Drop-off Location</p>
                  <p className="text-gray-600 text-sm">{dropoffLocation}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Time</p>
                  <p className="text-gray-600 text-sm">
                    {selectedDateTime ? format(new Date(selectedDateTime), 'MMM d, yyyy \'at\' h:mm a') : 'Not selected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {passengerCount || 1} passenger{(passengerCount || 1) > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Luggage className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {luggageCount || 0} bag{(luggageCount || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="font-medium text-gray-900 mb-1">Vehicle Type</p>
              <p className="text-gray-600 text-sm">{vehicleType || 'Premium Sedan'}</p>
            </div>

            {flightInfo && (
              <div className="border-t pt-4">
                <p className="font-medium text-gray-900 mb-1">Flight Information</p>
                <p className="text-gray-600 text-sm">{flightInfo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleConfirmBooking}
            disabled={isCreating || bookingSubmitted}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-lg"
          >
            {isCreating ? 'Creating Booking...' : bookingSubmitted ? 'Booking Submitted' : 'Confirm Booking'}
          </Button>
          
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            disabled={isCreating}
            className="w-full"
          >
            Back to Edit
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By confirming, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
