import React from 'react';
import { Card } from "@/components/ui/card";
import { Send, MapPin, User, Map, Flag, CheckCircle } from "lucide-react";

interface RideStatusProgressionProps {
  booking: any;
  userType: "passenger" | "driver";
}

export const RideStatusProgression = ({ booking, userType }: RideStatusProgressionProps) => {
  const currentStage = booking.ride_stage || 'driver_heading_to_pickup';
  
  // Define all stages in order
  const stages = [
    'driver_heading_to_pickup',
    'driver_arrived_at_pickup',
    'passenger_onboard',
    'in_transit',
    'driver_arrived_at_dropoff',
    'completed'
  ];

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEstimatedArrival = () => {
    const now = new Date();
    const estimated = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
    return estimated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isStageActive = (stage: string) => {
    const currentIndex = stages.indexOf(currentStage);
    const stageIndex = stages.indexOf(stage);
    return stageIndex <= currentIndex;
  };

  const isCurrentStage = (stage: string) => {
    return stage === currentStage;
  };

  const renderStatusCard = (stage: string) => {
    const active = isStageActive(stage);
    const current = isCurrentStage(stage);
    
    if (!active && !current) return null;

    interface StageConfig {
      icon: React.ReactNode;
      iconBg: string;
      title: string;
      subtitle: string;
      timeBg: string;
      cardBorder: string;
      cardBg: string;
      timeLabel?: string;
      estimated?: boolean;
      note?: string;
      startTime?: boolean;
      route?: boolean;
      completed?: boolean;
    }

    const stageConfigs: Record<string, StageConfig> = {
      'driver_heading_to_pickup': {
        icon: <Send className="h-6 w-6 text-white" />,
        iconBg: 'bg-blue-500',
        title: 'Driver Heading to Pickup',
        subtitle: 'Driver is on the way to pick you up',
        timeBg: 'bg-gray-800',
        timeLabel: 'Departure time',
        cardBorder: 'border-yellow-400',
        cardBg: 'bg-white shadow-lg',
        estimated: true
      },
      'driver_arrived_at_pickup': {
        icon: <MapPin className="h-6 w-6 text-white" />,
        iconBg: 'bg-green-500',
        title: 'Driver Arrived at Pickup',
        subtitle: 'Your driver is waiting at the pickup point',
        timeBg: 'bg-gray-800',
        cardBorder: 'border-green-400',
        cardBg: 'bg-white shadow-lg',
        note: 'Please meet the driver promptly.'
      },
      'passenger_onboard': {
        icon: <User className="h-6 w-6 text-white" />,
        iconBg: 'bg-orange-500',
        title: 'Passenger Onboard',
        subtitle: 'Ride has started. Enjoy your trip.',
        timeBg: 'bg-gray-800',
        cardBorder: 'border-orange-400',
        cardBg: 'bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg',
        startTime: true
      },
      'in_transit': {
        icon: <Map className="h-6 w-6 text-white" />,
        iconBg: 'bg-yellow-500',
        title: 'In Transit with Optional Stops',
        subtitle: 'Driver is en route, with potential quick stops along the way',
        timeBg: 'bg-gray-800',
        cardBorder: 'border-yellow-400',
        cardBg: 'bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg',
        route: true
      },
      'driver_arrived_at_dropoff': {
        icon: <Flag className="h-6 w-6 text-white" />,
        iconBg: 'bg-purple-500',
        title: 'Driver Arrived at Drop-off Location',
        subtitle: "You've reached your destination.",
        timeBg: 'bg-gray-800',
        cardBorder: 'border-purple-400',
        cardBg: 'bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg',
        note: 'Please exit the vehicle safely. Thank you!'
      },
      'completed': {
        icon: <CheckCircle className="h-6 w-6 text-white" />,
        iconBg: 'bg-green-500',
        title: 'Ride Completed Successfully',
        subtitle: 'We hope you enjoyed your trip',
        timeBg: 'bg-gray-800',
        cardBorder: 'border-green-400',
        cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg',
        completed: true
      }
    };

    const config = stageConfigs[stage as keyof typeof stageConfigs];
    if (!config) return null;

    return (
      <div key={stage} className={`border-2 ${config.cardBorder} ${config.cardBg} rounded-2xl p-4 mb-3 relative`}>
        {/* Time Badge */}
        <div className={`absolute top-4 right-4 ${config.timeBg} text-white px-3 py-1 rounded-full text-sm font-medium`}>
          {getCurrentTime()}
        </div>
        
        {config.timeLabel && (
          <div className="absolute top-0 right-4 bg-gray-600 text-white px-2 py-1 rounded-b-lg text-xs">
            {config.timeLabel}
          </div>
        )}

        {/* Main Content */}
        <div className="flex items-start gap-4 mt-2">
          {/* Icon */}
          <div className={`${config.iconBg} p-3 rounded-full shadow-md`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {config.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              {config.subtitle}
            </p>

            {/* Estimated Arrival */}
            {config.estimated && (
              <div className="mt-4">
                <p className="text-lg font-bold text-gray-900">
                  Estimated arrival: {getEstimatedArrival()}
                </p>
                <p className="text-gray-500 text-sm">Estimated arrival</p>
              </div>
            )}

            {/* Start Time */}
            {config.startTime && (
              <div className="mt-4">
                <p className="text-lg font-bold text-gray-900">Start Time</p>
                <p className="text-gray-600 text-sm">{getCurrentTime()} / 285m</p>
              </div>
            )}

            {/* Route Info */}
            {config.route && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <MapPin className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="w-px h-8 bg-yellow-300"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Next scheduled stop: [Optional]
                  </p>
                  <p className="text-sm text-gray-600">Direct to destination</p>
                </div>
              </div>
            )}

            {/* Note */}
            {config.note && (
              <div className="mt-3">
                <p className="text-gray-700 text-sm font-medium">
                  {config.note}
                </p>
              </div>
            )}

            {/* Completed Actions */}
            {config.completed && userType === 'passenger' && (
              <div className="mt-4">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-6 h-6 text-yellow-400">
                      ⭐
                    </div>
                  ))}
                </div>
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-xl transition-colors">
                  Leave a review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Only show progression for rides that are "all_set" or have started
  if (booking.payment_confirmation_status !== 'all_set' && !booking.ride_stage) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Ride Progress</h4>
      <div className="space-y-2">
        {/* Show current stage and completed stages */}
        {stages.map((stage) => {
          if (isStageActive(stage) || isCurrentStage(stage)) {
            return renderStatusCard(stage);
          }
          return null;
        })}
      </div>
    </div>
  );
};