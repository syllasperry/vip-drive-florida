import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { RideStatus, RideStatusType } from "@/hooks/useRideStatusSync";

interface TimelineBlock {
  icon: string;
  label: string;
  timestamp: string;
  userType: 'driver' | 'passenger';
  photoUrl: string;
  stepTag: RideStatusType;
  isCurrent: boolean;
  isCompleted: boolean;
}

interface VisualRoadmapTimelineProps {
  rideStatus: RideStatusType;
  userType: 'passenger' | 'driver';
  timestamps: { [key: string]: string };
  userPhotoUrl?: string;
  otherUserPhotoUrl?: string;
  otherUserName?: string;
  onOpenModal?: (status: string) => void;
  className?: string;
}

// Status order for timeline progression
const statusOrder: RideStatusType[] = [
  RideStatus.REQUESTED,
  RideStatus.ACCEPTED_BY_DRIVER,
  RideStatus.OFFER_SENT,
  RideStatus.OFFER_ACCEPTED,
  RideStatus.ALL_SET,
  RideStatus.CANCELLED_BY_DRIVER,
  RideStatus.CANCELLED_BY_PASSENGER
];

// Labels for each user type perspective
const roadmapLabels = {
  passenger: {
    [RideStatus.REQUESTED]: "Booking Request Sent",
    [RideStatus.ACCEPTED_BY_DRIVER]: "Driver Accepted the Ride",
    [RideStatus.OFFER_SENT]: "Driver Sent a Fare Offer",
    [RideStatus.OFFER_ACCEPTED]: "You Accepted the Offer",
    [RideStatus.ALL_SET]: "You're All Set!",
    [RideStatus.CANCELLED_BY_DRIVER]: "Driver Cancelled the Ride",
    [RideStatus.CANCELLED_BY_PASSENGER]: "You Cancelled the Ride",
    [RideStatus.OFFER_DECLINED]: "You Declined the Offer"
  },
  driver: {
    [RideStatus.REQUESTED]: "New Ride Request Received",
    [RideStatus.ACCEPTED_BY_DRIVER]: "You Accepted the Ride",
    [RideStatus.OFFER_SENT]: "You Sent a Fare Offer",
    [RideStatus.OFFER_ACCEPTED]: "Passenger Accepted the Offer",
    [RideStatus.ALL_SET]: "Ride is All Set!",
    [RideStatus.CANCELLED_BY_DRIVER]: "You Cancelled this Ride",
    [RideStatus.CANCELLED_BY_PASSENGER]: "Passenger Cancelled the Ride",
    [RideStatus.OFFER_DECLINED]: "Passenger Declined the Offer"
  }
};

// Icons for each status
const roadmapIcons = {
  [RideStatus.REQUESTED]: "📝",
  [RideStatus.ACCEPTED_BY_DRIVER]: "✔️",
  [RideStatus.OFFER_SENT]: "💵",
  [RideStatus.OFFER_ACCEPTED]: "✅",
  [RideStatus.ALL_SET]: "🎉",
  [RideStatus.CANCELLED_BY_DRIVER]: "❌",
  [RideStatus.CANCELLED_BY_PASSENGER]: "❌",
  [RideStatus.OFFER_DECLINED]: "❌"
};

// Determine which user performed each action
const actionOwners = {
  [RideStatus.REQUESTED]: 'passenger',
  [RideStatus.ACCEPTED_BY_DRIVER]: 'driver',
  [RideStatus.OFFER_SENT]: 'driver',
  [RideStatus.OFFER_ACCEPTED]: 'passenger',
  [RideStatus.ALL_SET]: 'driver',
  [RideStatus.CANCELLED_BY_DRIVER]: 'driver',
  [RideStatus.CANCELLED_BY_PASSENGER]: 'passenger',
  [RideStatus.OFFER_DECLINED]: 'passenger'
};

// Helper to validate if a status should be displayed
function isStepReached(stepKey: RideStatusType, currentStatus: RideStatusType): boolean {
  // Handle cancellation states
  if (currentStatus.includes('cancelled') || currentStatus === RideStatus.OFFER_DECLINED) {
    if (stepKey.includes('cancelled') || stepKey === RideStatus.OFFER_DECLINED) {
      return stepKey === currentStatus;
    }
    // Show steps up to the point where cancellation happened
    const currentIdx = statusOrder.indexOf(RideStatus.OFFER_SENT); // Usually cancelled after offer
    const stepIdx = statusOrder.indexOf(stepKey);
    return stepIdx <= currentIdx;
  }

  const currentIdx = statusOrder.indexOf(currentStatus);
  const stepIdx = statusOrder.indexOf(stepKey);
  return stepIdx <= currentIdx && !stepKey.includes('cancelled') && stepKey !== RideStatus.OFFER_DECLINED;
}

export const VisualRoadmapTimeline = ({
  rideStatus,
  userType,
  timestamps,
  userPhotoUrl,
  otherUserPhotoUrl,
  otherUserName = userType === 'passenger' ? 'Driver' : 'Passenger',
  onOpenModal,
  className = ""
}: VisualRoadmapTimelineProps) => {
  const roadmap = roadmapLabels[userType];

  // Generate timeline steps
  const steps: TimelineBlock[] = statusOrder
    .filter((stepKey) => isStepReached(stepKey, rideStatus))
    .map((stepKey) => {
      const actionOwner = actionOwners[stepKey];
      const isCurrentStep = stepKey === rideStatus;
      const isCompleted = !isCurrentStep && isStepReached(stepKey, rideStatus);
      
      return {
        icon: roadmapIcons[stepKey],
        label: roadmap[stepKey],
        timestamp: timestamps[stepKey] || '',
        userType: actionOwner as 'driver' | 'passenger',
        photoUrl: actionOwner === userType ? (userPhotoUrl || '') : (otherUserPhotoUrl || ''),
        stepTag: stepKey,
        isCurrent: isCurrentStep,
        isCompleted
      };
    });

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ride Timeline</h3>
            <Badge variant="outline" className="text-xs">
              {userType === 'passenger' ? 'Passenger View' : 'Driver View'}
            </Badge>
          </div>

          {/* Timeline Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isClickable = step.isCurrent && onOpenModal;
              const isOwnAction = step.userType === userType;
              
              return (
                <div
                  key={`${step.stepTag}-${index}`}
                  className={`relative flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 ${
                    step.isCurrent 
                      ? 'bg-blue-50 border-blue-200 shadow-sm dark:bg-blue-900/10 dark:border-blue-800' 
                      : step.isCompleted
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                        : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                  } ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
                  onClick={() => isClickable && onOpenModal(step.stepTag)}
                >
                  {/* User Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                    <AvatarImage src={step.photoUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {step.userType === 'passenger' ? 'P' : 'D'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Status Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    step.isCurrent
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : step.isCompleted
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${
                        step.isCurrent ? 'text-blue-800 dark:text-blue-200' :
                        step.isCompleted ? 'text-green-800 dark:text-green-200' :
                        'text-gray-700 dark:text-gray-300'
                      }`}>
                        {step.label}
                      </p>
                      <Badge 
                        variant={isOwnAction ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {isOwnAction ? 'YOU' : step.userType.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {step.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(step.timestamp), "MMM d, h:mm a")}
                      </p>
                    )}
                  </div>

                  {/* Clickable indicator */}
                  {isClickable && (
                    <div className="text-blue-600 text-xs font-medium">
                      Click to review
                    </div>
                  )}

                  {/* Timeline connector */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-7 top-16 w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Current Status: <span className="font-medium text-foreground">{roadmap[rideStatus]}</span>
              </span>
              {steps.length > 0 && steps[steps.length - 1].timestamp && (
                <span className="text-muted-foreground">
                  Last updated: {format(new Date(steps[steps.length - 1].timestamp), "h:mm a")}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};