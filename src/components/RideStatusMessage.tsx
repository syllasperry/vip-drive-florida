import React from 'react';
import { Send, MapPin, User, Route, Flag, CheckCircle } from 'lucide-react';

interface RideStatusMessageProps {
  rideStage: string;
  timestamp?: string;
}

const rideStageConfig = {
  'driver_heading_to_pickup': { 
    label: 'Heading to Pickup',
    icon: Send,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    message: "I'm heading to your pickup location. Estimated arrival in 10 minutes."
  },
  'driver_arrived_at_pickup': { 
    label: 'Arrived at Pickup',
    icon: MapPin,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    message: "I'm at the pickup location. Please meet me promptly."
  },
  'passenger_onboard': { 
    label: 'Passenger Onboard',
    icon: User,
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    message: 'Passenger onboard. Ride started. Enjoy the trip!'
  },
  'in_transit': { 
    label: 'In Transit with Stops',
    icon: Route,
    bgColor: 'bg-yellow-400',
    textColor: 'text-white',
    message: 'We are on the way. Quick stops may happen during the ride.'
  },
  'driver_arrived_at_dropoff': { 
    label: 'Arrived at Drop-off',
    icon: Flag,
    bgColor: 'bg-purple-500',
    textColor: 'text-white',
    message: "We've arrived at your destination. Please exit the vehicle safely."
  },
  'completed': { 
    label: 'Ride Completed',
    icon: CheckCircle,
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-700',
    message: 'Thank you for riding with us! Please leave a review if you\'d like.'
  }
};

export const RideStatusMessage = ({ rideStage, timestamp }: RideStatusMessageProps) => {
  const config = rideStageConfig[rideStage as keyof typeof rideStageConfig];
  
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`${config.bgColor} ${config.textColor} p-2 rounded-full flex-shrink-0`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-900">{config.label}</h4>
            {timestamp && (
              <span className="text-xs text-gray-500">{timestamp}</span>
            )}
          </div>
          <p className="text-sm text-gray-600">{config.message}</p>
        </div>
      </div>
    </div>
  );
};