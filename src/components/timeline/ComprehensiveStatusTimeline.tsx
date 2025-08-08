
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useRideStatus } from '@/hooks/useRideStatus';

interface ComprehensiveStatusTimelineProps {
  bookingId: string;
  userType: 'passenger' | 'driver';
  passengerData?: {
    name: string;
    photo_url?: string;
  };
  driverData?: {
    name: string;
    photo_url?: string;
  };
  finalPrice?: string;
  className?: string;
}

interface TimelineItem {
  id: string;
  label: string;
  timestamp: string;
  price?: string;
  backgroundColor: string;
  textColor: string;
  actor: {
    name: string;
    role: 'Driver' | 'Passenger';
    photo_url?: string;
  };
  isCompleted: boolean;
}

const statusConfig = {
  'pending': {
    passenger_label: 'Booking Request Sent',
    driver_label: 'Booking Request Received',
    bg: 'bg-sky-400',
    text: 'text-white',
    actor: 'passenger'
  },
  'offer_sent': {
    passenger_label: 'Offer Received - Awaiting Acceptance',
    driver_label: 'Offer Sent - Awaiting Passenger Response',
    bg: 'bg-orange-400',
    text: 'text-white',
    actor: 'driver'
  },
  'offer_accepted': {
    passenger_label: 'Offer Accepted',
    driver_label: 'Offer Accepted',
    bg: 'bg-amber-400',
    text: 'text-black',
    actor: 'passenger'
  },
  'payment_confirmed': {
    passenger_label: 'Payment Confirmed',
    driver_label: 'Payment Confirmed',
    bg: 'bg-sky-500',
    text: 'text-white',
    actor: 'passenger'
  },
  'all_set': {
    passenger_label: 'All Set',
    driver_label: 'All Set',
    bg: 'bg-purple-500',
    text: 'text-white',
    actor: 'driver'
  }
};

const statusOrder = ['pending', 'offer_sent', 'offer_accepted', 'payment_confirmed', 'all_set'];

export const ComprehensiveStatusTimeline = ({ 
  bookingId, 
  userType, 
  passengerData,
  driverData,
  finalPrice,
  className = "" 
}: ComprehensiveStatusTimelineProps) => {
  const { statusData, loading } = useRideStatus({ 
    rideId: bookingId, 
    userType,
    enabled: !!bookingId 
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const currentStatus = statusData?.current_status || 'pending';
  const currentStatusIndex = statusOrder.indexOf(currentStatus);

  const timelineItems: TimelineItem[] = statusOrder
    .map((statusKey, index) => {
      const config = statusConfig[statusKey as keyof typeof statusConfig];
      const isCompleted = index <= currentStatusIndex;
      
      if (!isCompleted) return null;

      const statusEntry = statusData?.statuses?.find(s => s.status_code === statusKey);
      const actorRole = config.actor;
      const actorData = actorRole === 'passenger' ? passengerData : driverData;
      
      return {
        id: statusKey,
        label: userType === 'passenger' 
          ? config.passenger_label 
          : config.driver_label,
        timestamp: statusEntry?.status_timestamp 
          ? format(new Date(statusEntry.status_timestamp), 'h:mm a')
          : '',
        price: (statusKey === 'offer_sent' || statusKey === 'offer_accepted') && finalPrice 
          ? `$${finalPrice}` 
          : undefined,
        backgroundColor: config.bg,
        textColor: config.text,
        actor: {
          name: actorData?.name || (actorRole === 'passenger' ? 'Passenger' : 'Driver'),
          role: actorRole === 'passenger' ? 'Passenger' : 'Driver',
          photo_url: actorData?.photo_url
        },
        isCompleted: true
      };
    })
    .filter((item): item is TimelineItem => item !== null)
    .reverse(); // Most recent first

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
        {finalPrice && (
          <span className="text-lg font-semibold text-emerald-600">
            ${finalPrice}
          </span>
        )}
      </div>
      
      {timelineItems.map((item, index) => (
        <Card 
          key={`${item.id}-${index}`}
          className={`${item.backgroundColor} border-none shadow-sm rounded-xl`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className={`font-semibold text-sm ${item.textColor}`}>
                      {item.label}
                    </h4>
                    <p className={`text-xs ${item.textColor} opacity-75 mt-1`}>
                      {item.actor.name} • {item.actor.role}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.timestamp && (
                      <div className={`text-sm ${item.textColor} opacity-90`}>
                        {item.timestamp}
                      </div>
                    )}
                    {item.price && (
                      <div className={`text-sm font-medium ${item.textColor} opacity-90`}>
                        {item.price}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="ml-4">
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={item.actor.photo_url} />
                  <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                    {item.actor.role.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {timelineItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No status updates yet
        </div>
      )}
    </div>
  );
};
