
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Car, Phone, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingData {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_name: string;
  passenger_phone: string;
  vehicle_type: string;
  final_price: number;
  status: string;
  ride_stage: string;
}

const RideProgressScreen: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingData();
    }
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          pickup_time,
          passenger_first_name,
          passenger_last_name,
          passenger_phone,
          vehicle_type,
          final_price,
          status,
          ride_stage
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      if (data) {
        setBooking({
          ...data,
          passenger_name: `${data.passenger_first_name || ''} ${data.passenger_last_name || ''}`.trim() || 'Passenger',
        });
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRideStage = async (newStage: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ ride_stage: newStage })
        .eq('id', bookingId);

      if (error) throw error;

      setBooking(prev => prev ? { ...prev, ride_stage: newStage } : null);
      
      toast({
        title: "Status Updated",
        description: `Ride status updated to ${newStage}`,
      });
    } catch (error) {
      console.error('Error updating ride stage:', error);
      toast({
        title: "Error",
        description: "Failed to update ride status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Booking not found</h2>
          <Button onClick={() => navigate('/driver/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getStageActions = () => {
    const stage = booking.ride_stage;
    
    switch (stage) {
      case 'driver_heading_to_pickup':
        return (
          <Button 
            onClick={() => updateRideStage('driver_arrived_at_pickup')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Mark as Arrived at Pickup
          </Button>
        );
      case 'driver_arrived_at_pickup':
        return (
          <Button 
            onClick={() => updateRideStage('passenger_onboard')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Passenger Onboard
          </Button>
        );
      case 'passenger_onboard':
        return (
          <Button 
            onClick={() => updateRideStage('in_transit')}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Start Journey
          </Button>
        );
      case 'in_transit':
        return (
          <Button 
            onClick={() => updateRideStage('completed')}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Complete Ride
          </Button>
        );
      case 'completed':
        return (
          <div className="text-center">
            <p className="text-green-600 font-semibold mb-4">Ride Completed!</p>
            <Button onClick={() => navigate('/driver/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        );
      default:
        return (
          <Button 
            onClick={() => updateRideStage('driver_heading_to_pickup')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Start Heading to Pickup
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        {/* Header */}
        <div className="bg-red-600 text-white p-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/driver/dashboard')}
            className="text-white hover:bg-red-700 mb-2"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold">Ride in Progress</h1>
          <Badge variant="secondary" className="mt-2">
            {booking.ride_stage?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
          </Badge>
        </div>

        <div className="p-4 space-y-6">
          {/* Passenger Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Passenger Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{booking.passenger_name}</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{booking.passenger_phone || 'No phone provided'}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-sm">Pickup</p>
                    <p className="text-gray-600 text-sm">{booking.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-sm">Drop-off</p>
                    <p className="text-gray-600 text-sm">{booking.dropoff_location}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2 border-t">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {new Date(booking.pickup_time).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{booking.vehicle_type}</span>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-lg font-bold text-red-600">
                  ${booking.final_price?.toFixed(2) || 'TBD'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="pb-8">
            {getStageActions()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideProgressScreen;
