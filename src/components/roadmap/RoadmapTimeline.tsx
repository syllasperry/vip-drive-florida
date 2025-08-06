import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getRoadmapConfig, RoadmapStep } from "@/utils/roadmapStatusManager";

interface RoadmapTimelineProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export const RoadmapTimeline = ({ 
  booking, 
  userType, 
  onStepClick,
  className = "" 
}: RoadmapTimelineProps) => {
  if (!booking) return null;

  const config = getRoadmapConfig(booking);
  const steps = userType === 'passenger' ? config.passengerSteps : config.driverSteps;
  
  const otherUserData = userType === 'passenger' ? booking.drivers : booking.passengers;
  const otherUserName = userType === 'passenger' 
    ? (booking.drivers?.full_name || "Driver")
    : (booking.passenger_name || `${booking.passenger_first_name || ''} ${booking.passenger_last_name || ''}`.trim() || "Passenger");
  const otherUserPhoto = userType === 'passenger'
    ? booking.drivers?.profile_photo_url
    : (booking.passenger_photo_url || booking.passenger_photo);

  const getStepIcon = (step: RoadmapStep) => {
    switch (step.status) {
      case 'completed':
        return CheckCircle;
      case 'current':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  const getStepColor = (step: RoadmapStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-blue-600';
      default:
        return 'text-gray-400';
    }
  };

  const getBadgeVariant = (actor: string) => {
    if (actor === userType) return 'default';
    return 'secondary';
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Timeline Steps */}
        <div className="space-y-3 mb-4">
          {steps.map((step, index) => {
            const StepIcon = getStepIcon(step);
            const isClickable = step.status === 'current' && step.modalType;
            
            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' 
                    ? 'bg-green-100 dark:bg-green-900/20' 
                    : step.status === 'current' 
                      ? 'bg-blue-100 dark:bg-blue-900/20' 
                      : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <StepIcon className={`h-4 w-4 ${getStepColor(step)}`} />
                </div>
                
                <div 
                  className={`flex-1 p-3 rounded-lg border ${
                    step.status === 'completed'
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                      : step.status === 'current'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                  } ${isClickable ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20' : ''}`}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{step.label}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                    <Badge variant={getBadgeVariant(step.actor)} className="text-xs">
                      {step.actor === userType ? 'YOU' : step.actor.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Other User Information */}
        {otherUserData && (
          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUserPhoto} alt={otherUserName} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {otherUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{otherUserName}</h4>
                <p className="text-sm text-muted-foreground">
                  {userType === 'passenger' ? 'Your Driver' : 'Your Passenger'}
                </p>
              </div>
              {userType === 'passenger' && booking.vehicle_type && (
                <div className="text-right">
                  <div className="text-sm font-medium">{booking.vehicle_type}</div>
                  <div className="text-xs text-muted-foreground">Vehicle</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
