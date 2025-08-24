
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Calendar, Clock, Car, DollarSign, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface BookingConfirmationProps {
  booking: {
    id: string;
    booking_code?: string;
    status: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_time: string;
    vehicle_type?: string;
    passenger_count?: number;
    estimated_price?: number;
    final_price?: number;
    distance_miles?: number;
  };
  onViewDashboard: () => void;
}

export const BookingConfirmation = ({ booking, onViewDashboard }: BookingConfirmationProps) => {
  const getNextSteps = () => {
    switch (booking.status?.toLowerCase()) {
      case 'pending':
        return [
          'Your booking request has been received',
          'Our dispatcher will review your request shortly',
          'You will receive an offer with pricing details',
          'Once you accept and pay, your driver will be assigned'
        ];
      case 'offer_sent':
        return [
          'You have received a pricing offer',
          'Review the offer details and pricing',
          'Accept the offer and complete payment',
          'Your driver will be assigned after payment'
        ];
      case 'all_set':
        return [
          'Your booking is confirmed and paid',
          'Your driver has been assigned',
          'You will receive driver details and contact info',
          'Your driver will contact you before pickup'
        ];
      default:
        return [
          'Your booking is being processed',
          'You will receive updates via email and dashboard',
          'Check your dashboard for the latest status'
        ];
    }
  };

  const getStatusColor = () => {
    switch (booking.status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offer_sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'all_set':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your ride has been successfully booked. Here are your booking details:
          </p>
        </div>

        {/* Booking Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Booking #{booking.booking_code || booking.id.slice(-8).toUpperCase()}
              </CardTitle>
              <Badge className={`px-3 py-1 text-sm border ${getStatusColor()}`}>
                {booking.status?.replace('_', ' ').toUpperCase() || 'CONFIRMED'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trip Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Location</p>
                  <p className="text-gray-600">{booking.pickup_location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Drop-off Location</p>
                  <p className="text-gray-600">{booking.dropoff_location}</p>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Date</p>
                  <p className="text-gray-600">
                    {format(parseISO(booking.pickup_time), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Time</p>
                  <p className="text-gray-600">
                    {format(parseISO(booking.pickup_time), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {booking.vehicle_type && (
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Vehicle</p>
                    <p className="text-gray-600">{booking.vehicle_type}</p>
                  </div>
                </div>
              )}
              
              {(booking.final_price || booking.estimated_price) && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Price</p>
                    <p className="text-gray-600">
                      ${booking.final_price || booking.estimated_price}
                      {booking.distance_miles && ` (${booking.distance_miles} miles)`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {booking.passenger_count && booking.passenger_count > 1 && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Passengers</p>
                  <p className="text-gray-600">{booking.passenger_count} passengers</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {getNextSteps().map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="text-center">
          <Button onClick={onViewDashboard} className="px-8 py-3">
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
