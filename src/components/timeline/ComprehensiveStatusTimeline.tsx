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
  actualTimestamp: Date;
  statusKey: string;
}

const statusConfig = {
  'pending': {
    passenger_label: 'Booking Request Sent',
    driver_label: 'Booking Request Received',
    bg: 'bg-sky-400',
    text: 'text-white',
    actor: 'passenger',
    order: 1
  },
  'offer_sent': {
    passenger_label: 'Offer Received - Awaiting Acceptance',
    driver_label: 'Offer Sent - Awaiting Passenger Response',
    bg: 'bg-orange-400',
    text: 'text-white',
    actor: 'driver',
    order: 2
  },
  'offer_accepted': {
    passenger_label: 'Offer Accepted',
    driver_label: 'Offer Accepted',
    bg: 'bg-green-500',
    text: 'text-white',
    actor: 'passenger',
    order: 3
  },
  'payment_confirmed': {
    passenger_label: 'Payment Confirmed',
    driver_label: 'Payment Confirmed',
    bg: 'bg-sky-500',
    text: 'text-white',
    actor: 'passenger',
    order: 4
  },
  'all_set': {
    passenger_label: 'All Set',
    driver_label: 'All Set',
    bg: 'bg-purple-500',
    text: 'text-white',
    actor: 'driver',
    order: 5
  }
};

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

  console.log('🔍 ComprehensiveStatusTimeline Debug - Raw Data:', {
    bookingId,
    currentStatus: statusData?.current_status,
    statusHistory: statusData?.statuses,
    finalPrice,
    passengerData,
    driverData,
    userType
  });

  if (!statusData?.statuses || statusData.statuses.length === 0) {
    console.log('❌ No status data available');
    return (
      <div className="text-center py-8 text-gray-500">
        No status updates yet
      </div>
    );
  }

  // Remove duplicates by status code and keep the most recent entry for each unique status
  const uniqueStatuses = statusData.statuses.reduce((acc, statusEntry) => {
    const existingIndex = acc.findIndex(item => item.status_code === statusEntry.status_code);
    
    if (existingIndex >= 0) {
      // Compare timestamps and keep the more recent one
      const existingTimestamp = new Date(acc[existingIndex].status_timestamp);
      const currentTimestamp = new Date(statusEntry.status_timestamp);
      
      if (currentTimestamp > existingTimestamp) {
        acc[existingIndex] = statusEntry; // Replace with more recent entry
      }
    } else {
      acc.push(statusEntry); // Add new unique status
    }
    
    return acc;
  }, [] as typeof statusData.statuses);

  console.log('🔍 Unique Statuses After Deduplication:', uniqueStatuses);

  // Create timeline items from unique status history
  const timelineItems: TimelineItem[] = uniqueStatuses.map((statusEntry) => {
    const statusKey = statusEntry.status_code;
    const config = statusConfig[statusKey as keyof typeof statusConfig];
    
    if (!config) {
      console.log('⚠️ Unknown status key:', statusKey);
      return null;
    }
    
    const actorRole = config.actor;
    
    // CRITICAL FIX: Always show the correct person who performed the action
    let actorPhotoUrl: string | undefined;
    let actorName: string;
    
    if (actorRole === 'passenger') {
      actorPhotoUrl = passengerData?.photo_url;
      actorName = passengerData?.name || 'Passenger';
      console.log('🔍 Using passenger data:', { name: actorName, photo_url: actorPhotoUrl });
    } else {
      actorPhotoUrl = driverData?.photo_url;
      actorName = driverData?.name || 'Driver';
      console.log('🔍 Using driver data:', { name: actorName, photo_url: actorPhotoUrl });
    }
    
    const actualTimestamp = statusEntry.status_timestamp 
      ? new Date(statusEntry.status_timestamp)
      : new Date();
    
    const timelineItem: TimelineItem = {
      id: `${statusKey}-${actualTimestamp.getTime()}`,
      label: userType === 'passenger' 
        ? config.passenger_label 
        : config.driver_label,
      timestamp: format(actualTimestamp, 'h:mm a'),
      backgroundColor: config.bg,
      textColor: config.text,
      actor: {
        name: actorName,
        role: actorRole === 'passenger' ? 'Passenger' : 'Driver' as 'Driver' | 'Passenger',
        photo_url: actorPhotoUrl
      },
      isCompleted: true,
      actualTimestamp,
      statusKey
    };

    // Add price for offer-related statuses
    if ((statusKey === 'offer_sent' || statusKey === 'offer_accepted') && finalPrice) {
      timelineItem.price = `$${finalPrice}`;
    }

    console.log('📊 Created Timeline Item:', {
      status: statusKey,
      actor: actorRole,
      photo_url: actorPhotoUrl,
      name: actorName,
      userType,
      finalItem: timelineItem
    });

    return timelineItem;
  }).filter(Boolean) as TimelineItem[];

  // Sort by actual timestamp - MOST RECENT FIRST (descending order)
  timelineItems.sort((a, b) => {
    return b.actualTimestamp.getTime() - a.actualTimestamp.getTime();
  });

  console.log('📊 Final Timeline Items (Most Recent First):', timelineItems.map(item => ({
    id: item.id,
    status: item.statusKey,
    timestamp: item.actualTimestamp.toISOString(),
    label: item.label,
    actor: item.actor.role,
    photo_url: item.actor.photo_url,
    name: item.actor.name
  })));

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Timeline Stack - Most Recent at Top */}
      {timelineItems.map((item, index) => (
        <Card 
          key={item.id}
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
                    <div className={`text-sm ${item.textColor} opacity-90`}>
                      {item.timestamp}
                    </div>
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
                  <AvatarImage src={item.actor.photo_url} alt={item.actor.name} />
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
