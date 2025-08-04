import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Phone, Send, MapPin, Users, Route, Flag, CheckCircle } from 'lucide-react';
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
    textColor: 'text-white'
  },
  { 
    value: 'driver_arrived_at_pickup', 
    label: 'Arrived at Pickup',
    icon: MapPin,
    bgColor: 'bg-green-500',
    textColor: 'text-white'
  },
  { 
    value: 'passenger_onboard', 
    label: 'Passenger Onboard',
    icon: Users,
    bgColor: 'bg-orange-500',
    textColor: 'text-white'
  },
  { 
    value: 'in_transit', 
    label: 'In Transit with Stops',
    icon: Route,
    bgColor: 'bg-yellow-400',
    textColor: 'text-white'
  },
  { 
    value: 'driver_arrived_at_dropoff', 
    label: 'Arrived at Drop-off',
    icon: Flag,
    bgColor: 'bg-purple-500',
    textColor: 'text-white'
  },
  { 
    value: 'completed', 
    label: 'Ride Completed',
    icon: CheckCircle,
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-700'
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

  const handleStageChange = async (newStage: string) => {
    console.log('=== RIDE PROGRESS DEBUG ===');
    console.log('Stage change clicked:', newStage);
    console.log('Current booking:', booking);
    console.log('Booking ID:', booking?.id);
    
    setSelectedStage(newStage);
    setIsUpdating(true);

    try {
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

      const { error, data } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Updated booking:', data);

      const stageLabel = rideStages.find(stage => stage.value === newStage)?.label;
      toast({
        title: "Status Updated",
        description: `Ride status updated to: ${stageLabel}`,
      });

      console.log('Toast sent with message:', stageLabel);
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast({
        title: "Error",
        description: "Failed to update ride status",
        variant: "destructive",
      });
      setSelectedStage(''); // Reset on error
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
                    ${selectedStage === stage.value ? 'ring-4 ring-blue-200 shadow-lg' : ''}
                  `}
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0" />
                  <span className="leading-tight">{stage.label}</span>
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
                <span className="text-gray-600">{booking.passenger_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">{booking.passenger_phone || 'No phone'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};