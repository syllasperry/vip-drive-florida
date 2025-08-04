import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone, Send, MapPin, Users, Route, Flag, CheckCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RideStage = 
  | 'driver_heading_to_pickup'
  | 'driver_arrived_at_pickup'
  | 'passenger_onboard'
  | 'in_transit'
  | 'driver_arrived_at_dropoff'
  | 'completed';

const rideStages = [
  { 
    value: 'driver_heading_to_pickup', 
    label: 'Heading to Pickup',
    icon: Send,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    message: 'I\'m heading to your pickup location. Estimated arrival in 10 minutes.'
  },
  { 
    value: 'driver_arrived_at_pickup', 
    label: 'Arrived at Pickup',
    icon: MapPin,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    message: 'I\'m at the pickup location. Please meet me promptly.'
  },
  { 
    value: 'passenger_onboard', 
    label: 'Passenger Onboard',
    icon: User,
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    message: 'Passenger onboard. Ride started. Enjoy the trip!'
  },
  { 
    value: 'in_transit', 
    label: 'In Transit with Stops',
    icon: Route,
    bgColor: 'bg-yellow-400',
    textColor: 'text-white',
    message: 'We are on the way. Quick stops may happen during the ride.'
  },
  { 
    value: 'driver_arrived_at_dropoff', 
    label: 'Arrived at Drop-off',
    icon: Flag,
    bgColor: 'bg-purple-500',
    textColor: 'text-white',
    message: 'We\'ve arrived at your destination. Please exit the vehicle safely.'
  },
  { 
    value: 'completed', 
    label: 'Ride Completed',
    icon: CheckCircle,
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-700',
    message: 'Thank you for riding with us! Please leave a review if you\'d like.'
  }
];

export const RideProgressScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const booking = location.state?.booking;
  
  // Start with no selection - driver must manually choose
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load current ride stage on mount
  React.useEffect(() => {
    if (booking?.ride_stage) {
      setSelectedStage(booking.ride_stage);
    }
  }, [booking?.ride_stage]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <p>No booking information available</p>
        </div>
      </div>
    );
  }

  const sendAutomaticMessage = async (messageText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      await supabase
        .from('messages')
        .insert({
          booking_id: booking.id,
          sender_id: user.id,
          sender_type: 'driver',
          message_text: messageText
        });
      
      console.log('Automatic message sent:', messageText);
    } catch (error) {
      console.error('Error sending automatic message:', error);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!booking?.id) {
      toast({
        title: "Error",
        description: "No booking ID found",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to update ride status",
        variant: "destructive",
      });
      return;
    }

    console.log('=== RIDE PROGRESS DEBUG ===');
    console.log('Stage change clicked:', newStage);
    console.log('Current booking:', booking);
    console.log('Booking ID:', booking?.id);
    console.log('User ID:', user.id);
    console.log('Driver ID from booking:', booking.driver_id);
    
    setIsUpdating(true);

    try {
      // Verify user can update this booking
      if (user.id !== booking.driver_id) {
        throw new Error('Unauthorized: You can only update your own rides');
      }

      const updateData: any = { 
        ride_stage: newStage,
        updated_at: new Date().toISOString()
      };

      // Set specific timestamps for key milestones
      if (newStage === 'passenger_onboard') {
        updateData.ride_started_at = new Date().toISOString();
      } else if (newStage === 'completed') {
        updateData.ride_completed_at = new Date().toISOString();
        updateData.status = 'completed';
        updateData.ride_status = 'completed';
      }

      console.log('Updating with data:', updateData);

      // First, let's try to get the current booking to confirm access
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', booking.id)
        .eq('driver_id', user.id)
        .single();

      if (fetchError || !currentBooking) {
        console.error('Cannot access booking:', fetchError);
        throw new Error('Cannot access this booking. Please check permissions.');
      }

      console.log('Current booking found:', currentBooking);

      // Now perform the update
      const { error, data } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id)
        .eq('driver_id', user.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Updated booking:', data);

      // Only set selectedStage AFTER successful update
      setSelectedStage(newStage);

      // Send automatic message to passenger
      const stage = rideStages.find(stage => stage.value === newStage);
      if (stage?.message) {
        await sendAutomaticMessage(stage.message);
      }

      const stageLabel = stage?.label;
      toast({
        title: "Status Updated",
        description: `Ride status updated to: ${stageLabel}`,
      });

      console.log('Toast sent with message:', stageLabel);
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update ride status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      console.log('=== END DEBUG ===');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 relative">
      {/* Background overlay for glass effect */}
      <div className="absolute inset-0 bg-black/5"></div>
      
      {/* Floating Status Panel */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 w-full max-w-sm">
          {/* Panel Header */}
          <div className="flex items-center justify-center relative mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="absolute left-0 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Ride Status Update</h2>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-4">
            {rideStages.map((stage) => {
              const IconComponent = stage.icon;
              return (
                <button
                  key={stage.value}
                  onClick={() => !isUpdating && handleStageChange(stage.value)}
                  disabled={isUpdating}
                  className={`
                    ${stage.bgColor} ${stage.textColor}
                    flex items-center gap-3 p-4 rounded-xl
                    font-semibold text-sm text-left
                    transition-all duration-200 ease-in-out
                    hover:scale-105 hover:shadow-lg
                    active:scale-95
                    disabled:opacity-50 disabled:cursor-not-allowed
                    relative
                    ${selectedStage === stage.value ? 'ring-4 ring-blue-300 shadow-xl scale-105' : ''}
                  `}
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0" />
                  <span className="leading-tight">{stage.label}</span>
                  {selectedStage === stage.value && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Loading State */}
          {isUpdating && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm">Updating status...</span>
              </div>
            </div>
          )}

          {/* Trip Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-700">Passenger:</span>
                <span className="text-gray-600">
                  {booking.passengers?.full_name || booking.passenger_name || 'Silas Pereira'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">
                  {booking.passengers?.phone || booking.passenger_phone || '(561) 350-2308'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};