import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone } from 'lucide-react';
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
  { value: 'driver_heading_to_pickup', label: 'Driver heading to pickup' },
  { value: 'driver_arrived_at_pickup', label: 'Driver arrived at pickup' },
  { value: 'passenger_onboard', label: 'Passenger onboard' },
  { value: 'in_transit', label: 'In transit with optional stops' },
  { value: 'driver_arrived_at_dropoff', label: 'Driver arrived at drop-off location' },
  { value: 'completed', label: 'Ride completed successfully' }
];

export const RideProgressScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const booking = location.state?.booking;
  
  // Start with no selection - driver must manually choose
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

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

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);

      if (error) throw error;

      const stageLabel = rideStages.find(stage => stage.value === newStage)?.label;
      toast({
        title: "Status Updated",
        description: `Ride status updated to: ${stageLabel}`,
      });
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Ride Progress</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Passenger Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600">
                  {booking.passenger_name?.charAt(0) || 'P'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{booking.passenger_name || 'Passenger'}</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{booking.passenger_phone || 'No phone'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ride Status Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ride Progress Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {rideStages.map((stage) => (
                <div key={stage.value} className="space-y-2">
                  <div 
                    className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => !isUpdating && handleStageChange(stage.value)}
                  >
                    <div className="relative">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedStage === stage.value 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-300 bg-white'
                      }`}>
                        {selectedStage === stage.value && (
                          <svg 
                            className="w-4 h-4 text-white" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={3} 
                              d="M5 13l4 4L19 7" 
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <Label 
                      htmlFor={stage.value} 
                      className="flex-1 text-base font-medium cursor-pointer"
                    >
                      {stage.label}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            
            {isUpdating && (
              <div className="mt-4 text-center text-gray-600">
                <p>Updating status...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">Pickup</h4>
                <p className="text-sm text-gray-600">{booking.pickup_location}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Drop-off</h4>
                <p className="text-sm text-gray-600">{booking.dropoff_location}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Scheduled Time</h4>
                <p className="text-sm text-gray-600">
                  {new Date(booking.pickup_datetime).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};