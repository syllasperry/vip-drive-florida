import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Clock, CheckCircle, Car, Flag, Plus, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type RideStage = 
  | 'driver_heading_to_pickup'
  | 'driver_arrived_at_pickup'
  | 'passenger_onboard'
  | 'in_transit'
  | 'driver_arrived_at_dropoff'
  | 'completed';

interface RideStatusFlowProps {
  booking: any;
  userType: "driver" | "passenger";
  onStatusUpdate?: (newStage: RideStage) => void;
}

const stageConfig = {
  driver_heading_to_pickup: {
    icon: Navigation,
    title: "Driver Heading to Pickup",
    description: "Driver is on the way to pick you up",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    nextStage: "driver_arrived_at_pickup" as RideStage,
    nextButtonText: "Arrived at Pickup",
    showEstimatedArrival: true
  },
  driver_arrived_at_pickup: {
    icon: MapPin,
    title: "Driver Arrived at Pickup",
    description: "Driver has arrived at the pickup location",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    nextStage: "passenger_onboard" as RideStage,
    nextButtonText: "Passenger Onboard"
  },
  passenger_onboard: {
    icon: Car,
    title: "Passenger Onboard",
    description: "Passenger is in the vehicle, ride starting",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    nextStage: "in_transit" as RideStage,
    nextButtonText: "Start Journey"
  },
  in_transit: {
    icon: Car,
    title: "In Transit with Optional Stops",
    description: "Journey in progress",
    color: "bg-green-100 text-green-800 border-green-200",
    nextStage: "driver_arrived_at_dropoff" as RideStage,
    nextButtonText: "Arrived at Destination"
  },
  driver_arrived_at_dropoff: {
    icon: Flag,
    title: "Driver Arrived at Drop-off Location",
    description: "Driver has reached the destination",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    nextStage: "completed" as RideStage,
    nextButtonText: "Complete Ride"
  },
  completed: {
    icon: CheckCircle,
    title: "Ride Completed Successfully",
    description: "Trip finished successfully",
    color: "bg-green-100 text-green-800 border-green-200",
    nextStage: null,
    nextButtonText: ""
  }
};

export const RideStatusFlow = ({ booking, userType, onStatusUpdate }: RideStatusFlowProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [extraStops, setExtraStops] = useState<string[]>(booking.extra_stops || []);
  const [newStop, setNewStop] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  
  // Calculate estimated arrival time (for driver_heading_to_pickup stage)
  const getEstimatedArrival = () => {
    if (currentStage === 'driver_heading_to_pickup') {
      // Simple estimation: add 15 minutes to current time
      // In a real app, this would use Google Maps API to calculate actual travel time
      const estimatedMinutes = 15;
      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedMinutes);
      return estimatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  };

  const currentStage = booking.ride_stage; // No default - only show if explicitly set by driver
  const config = currentStage ? stageConfig[currentStage as RideStage] : null;
  
  // Don't render anything if:
  // 1. No stage is set OR
  // 2. Booking is not "All Set"
  if (!config || !currentStage || booking.payment_confirmation_status !== 'all_set') {
    return null;
  }

  const handleStatusUpdate = async (nextStage: RideStage) => {
    if (userType !== "driver") return;

    setIsUpdating(true);
    try {
      // Update timestamp for instant feedback
      setCurrentTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      const updateData: any = { 
        ride_stage: nextStage,
        updated_at: new Date().toISOString()
      };

      // Set specific timestamps for key milestones
      if (nextStage === 'passenger_onboard') {
        updateData.ride_started_at = new Date().toISOString();
      } else if (nextStage === 'completed') {
        updateData.ride_completed_at = new Date().toISOString();
        updateData.status = 'completed';
        updateData.ride_status = 'completed';
      }

      // Update database - this will trigger real-time updates to passenger dashboard
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);

      if (error) throw error;

      const nextConfig = stageConfig[nextStage];
      toast({
        title: "Status Updated",
        description: `Ride status updated to: ${nextConfig.title}`,
      });

      onStatusUpdate?.(nextStage);
    } catch (error) {
      console.error('Error updating ride status:', error);
      toast({
        title: "Error",
        description: "Failed to update ride status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddStop = async () => {
    if (!newStop.trim()) return;

    try {
      const updatedStops = [...extraStops, newStop.trim()];
      
      const { error } = await supabase
        .from('bookings')
        .update({ extra_stops: updatedStops })
        .eq('id', booking.id);

      if (error) throw error;

      setExtraStops(updatedStops);
      setNewStop("");
      
      toast({
        title: "Stop Added",
        description: "Extra stop has been added to the route",
      });
    } catch (error) {
      console.error('Error adding stop:', error);
      toast({
        title: "Error",
        description: "Failed to add stop",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStop = async (index: number) => {
    try {
      const updatedStops = extraStops.filter((_, i) => i !== index);
      
      const { error } = await supabase
        .from('bookings')
        .update({ extra_stops: updatedStops })
        .eq('id', booking.id);

      if (error) throw error;

      setExtraStops(updatedStops);
      
      toast({
        title: "Stop Removed",
        description: "Extra stop has been removed from the route",
      });
    } catch (error) {
      console.error('Error removing stop:', error);
      toast({
        title: "Error",
        description: "Failed to remove stop",
        variant: "destructive",
      });
    }
  };

  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Current Status Display - Highlighted Yellow Border */}
      <Card className="border-2 border-yellow-400 bg-blue-50/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500 rounded-full">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-blue-700 mb-1">{config.title}</h3>
              <p className="text-blue-600 text-base mb-3">{config.description}</p>
              
              {/* Show estimated arrival for driver heading to pickup */}
              {currentStage === 'driver_heading_to_pickup' && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Estimated arrival: <span className="font-semibold text-gray-800">{getEstimatedArrival()}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full">
              <span className="text-sm font-medium">{currentTimestamp}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extra Stops Section (only during in_transit) */}
      {currentStage === 'in_transit' && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Optional Stops
            </h4>
            
            {/* Existing Stops */}
            {extraStops.length > 0 && (
              <div className="space-y-2 mb-3">
                {extraStops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{stop}</span>
                    {userType === "driver" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStop(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Stop */}
            {userType === "driver" && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add stop (e.g., pharmacy, gas station)"
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddStop} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Progress Button */}
      <Button
        variant="outline"
        onClick={() => {
          if (userType === "passenger") {
            navigate('/passenger/ride-progress', { 
              state: { 
                booking: booking, 
                userType: userType 
              } 
            });
          } else {
            navigate('/driver/ride-progress', { 
              state: { 
                booking: booking, 
                userType: userType 
              } 
            });
          }
        }}
        className="w-full py-3 text-base font-medium mb-2"
      >
        <Eye className="h-4 w-4 mr-2" />
        View Full Progress
      </Button>

      {/* Driver Action Button */}
      {userType === "driver" && config.nextStage && (
        <Button
          onClick={() => handleStatusUpdate(config.nextStage!)}
          disabled={isUpdating}
          className="w-full py-3 text-base font-medium"
        >
          {isUpdating ? "Updating..." : config.nextButtonText}
        </Button>
      )}

      {/* Completed Status */}
      {currentStage === 'completed' && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800">Trip Completed!</h3>
            <p className="text-sm text-green-700">Thank you for riding with us</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
