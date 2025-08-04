import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Send, MapPin, User, Map, Flag, CheckCircle } from "lucide-react";
import { AddStopModal } from "./AddStopModal";

interface RideStatusProgressionProps {
  booking: any;
  userType: "passenger" | "driver";
}

export const RideStatusProgression = ({ booking, userType }: RideStatusProgressionProps) => {
  const currentStage = booking.ride_stage; // No default - only show if explicitly set
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [localExtraStops, setLocalExtraStops] = useState(booking.extra_stops || []);
  
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
        {/* Time Badge - Repositioned to avoid text overlap */}
        <div className={`absolute top-2 right-2 ${config.timeBg} text-white px-2 py-1 rounded-lg text-xs font-medium opacity-90`}>
          {getCurrentTime()}
        </div>
        
        {config.timeLabel && (
          <div className="absolute top-0 right-2 bg-gray-600 text-white px-2 py-0.5 rounded-b-md text-xs opacity-80">
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

            {/* Route Info with Add Stop functionality for passengers */}
            {config.route && (
              <div className="mt-4">
                <div className="flex items-center gap-4 mb-3">
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
                
                {userType === 'passenger' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">Add optional stops</p>
                    {localExtraStops && localExtraStops.length > 0 && (
                      <div className="mb-2">
                        {localExtraStops.map((stop: any, idx: number) => (
                          <p key={idx} className="text-xs text-blue-800 mb-1">
                            {idx + 1}. {stop.address}
                          </p>
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={() => setIsAddStopModalOpen(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      + Add Stop
                    </button>
                  </div>
                )}
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

            {/* Completed Actions - Enhanced star rating only */}
            {config.completed && userType === 'passenger' && (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-8 h-8 text-yellow-400 text-2xl">
                      ⭐
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 font-medium">
                  Rate your experience
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Only show progression if:
  // 1. ride_stage is explicitly set by driver AND
  // 2. booking is marked as "All Set"
  if (!booking.ride_stage || booking.payment_confirmation_status !== 'all_set') {
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
      
      {/* Add Stop Modal for passengers */}
      {userType === 'passenger' && (
        <AddStopModal
          isOpen={isAddStopModalOpen}
          onClose={() => setIsAddStopModalOpen(false)}
          bookingId={booking.id}
          existingStops={localExtraStops}
          onStopsUpdated={setLocalExtraStops}
        />
      )}
    </div>
  );
};