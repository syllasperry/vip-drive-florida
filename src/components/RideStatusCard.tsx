import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navigation, Clock, Car, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface RideStatusCardProps {
  booking: any;
}

const stageConfig = {
  'driver_heading_to_pickup': {
    icon: Navigation,
    title: 'Driver Heading to Pickup',
    description: 'Driver is on the way to pick you up',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500'
  },
  'driver_arrived_at_pickup': {
    icon: MapPin,
    title: 'Driver Arrived at Pickup',
    description: 'Driver has arrived at pickup location',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500'
  },
  'passenger_onboard': {
    icon: Car,
    title: 'Passenger Onboard',
    description: 'Ride has started',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500'
  },
  'in_transit': {
    icon: Navigation,
    title: 'In Transit',
    description: 'On the way to destination',
    color: 'text-green-500',
    bgColor: 'bg-green-500'
  },
  'driver_arrived_at_dropoff': {
    icon: MapPin,
    title: 'Driver Arrived at Drop-off',
    description: 'Driver has arrived at destination',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500'
  },
  'completed': {
    icon: CheckCircle,
    title: 'Ride Completed Successfully',
    description: 'Thank you for choosing our service',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500'
  }
};

export const RideStatusCard = ({ booking }: RideStatusCardProps) => {
  const currentStage = booking.ride_stage;
  const isAllSet = booking.payment_confirmation_status === 'all_set';
  
  // Only show status cards if:
  // 1. Driver has explicitly set a ride_stage AND
  // 2. Booking is marked as "All Set"
  if (!currentStage || !isAllSet) {
    return null;
  }
  
  const config = stageConfig[currentStage as keyof typeof stageConfig];
  if (!config) {
    return null;
  }

  const IconComponent = config.icon;
  const currentTime = format(new Date(), 'hh:mm a');
  
  // Calculate ETA (15 minutes from now as placeholder)
  const eta = format(new Date(Date.now() + 15 * 60 * 1000), 'hh:mm a');

  return (
    <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
      <Card className="border-2 border-primary/20 shadow-lg bg-background/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${config.bgColor}`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {config.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-800 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentTime}
              </div>
            </div>
          </div>

          {booking.drivers && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={booking.drivers.profile_photo_url} 
                  alt={booking.drivers.full_name} 
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {booking.drivers.full_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {booking.drivers.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Your driver
                </p>
              </div>
            </div>
          )}

          {currentStage !== 'completed' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated arrival: {eta}</span>
            </div>
          )}

          {currentStage === 'completed' && (
            <Badge className="w-full justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Ride completed - Please rate your experience
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};