
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useRideStatus } from '@/hooks/useRideStatus';

interface StatusTimelineProps {
  bookingId: string;
  userType: 'passenger' | 'driver';
  userPhotoUrl?: string;
  otherUserPhotoUrl?: string;
  className?: string;
}

interface StatusBlock {
  id: string;
  label: string;
  timestamp: string;
  amount?: string;
  backgroundColor: string;
  textColor: string;
  order: number;
  isCompleted: boolean;
}

const passengerStatusConfig = {
  'pending': { 
    label: 'Booking Request Sent', 
    bg: 'bg-sky-400', 
    text: 'text-white',
    order: 1 
  },
  'offer_sent': { 
    label: 'Offer Received - Awaiting Acceptance', 
    bg: 'bg-orange-400', 
    text: 'text-white',
    order: 2 
  },
  'offer_accepted': { 
    label: 'Offer Accepted', 
    bg: 'bg-emerald-500', 
    text: 'text-white',
    order: 3 
  },
  'payment_confirmed': { 
    label: 'Payment Confirmed', 
    bg: 'bg-sky-500', 
    text: 'text-white',
    order: 4 
  },
  'all_set': { 
    label: 'All Set', 
    bg: 'bg-purple-500', 
    text: 'text-white',
    order: 5 
  }
};

const driverStatusConfig = {
  'pending': { 
    label: 'Booking Request Received', 
    bg: 'bg-sky-500', 
    text: 'text-white',
    order: 1 
  },
  'offer_sent': { 
    label: 'Offer Sent - Awaiting Passenger Response', 
    bg: 'bg-orange-500', 
    text: 'text-white',
    order: 2 
  },
  'offer_accepted': { 
    label: 'Offer Accepted', 
    bg: 'bg-amber-400', 
    text: 'text-black',
    order: 3 
  },
  'payment_confirmed': { 
    label: 'Payment Confirmed', 
    bg: 'bg-emerald-400', 
    text: 'text-white',
    order: 4 
  },
  'all_set': { 
    label: 'All Set', 
    bg: 'bg-emerald-600', 
    text: 'text-white',
    order: 5 
  }
};

const statusOrder = ['pending', 'offer_sent', 'offer_accepted', 'payment_confirmed', 'all_set'];

export const StatusTimeline = ({ 
  bookingId, 
  userType, 
  userPhotoUrl, 
  otherUserPhotoUrl,
  className = "" 
}: StatusTimelineProps) => {
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

  const statusConfig = userType === 'passenger' ? passengerStatusConfig : driverStatusConfig;
  const currentStatus = statusData?.current_status || 'pending';
  const currentStatusIndex = statusOrder.indexOf(currentStatus);

  const statusBlocks: StatusBlock[] = statusOrder.map((statusKey, index) => {
    const config = statusConfig[statusKey as keyof typeof statusConfig];
    const isCompleted = index <= currentStatusIndex;
    const statusEntry = statusData?.statuses?.find(s => s.status_code === statusKey);
    
    return {
      id: statusKey,
      label: config.label,
      timestamp: statusEntry?.status_timestamp ? format(new Date(statusEntry.status_timestamp), 'h:mm a') : '',
      amount: statusEntry?.metadata?.offer_price ? `$${statusEntry.metadata.offer_price}` : '',
      backgroundColor: config.bg,
      textColor: config.text,
      order: config.order,
      isCompleted
    };
  }).filter(block => block.isCompleted);

  const photoUrl = userType === 'passenger' ? userPhotoUrl : otherUserPhotoUrl;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
        {statusBlocks.length > 0 && statusBlocks[statusBlocks.length - 1].amount && (
          <span className="text-lg font-semibold text-emerald-600">
            {statusBlocks[statusBlocks.length - 1].amount}
          </span>
        )}
      </div>
      
      {statusBlocks.map((block) => (
        <Card 
          key={block.id}
          className={`${block.backgroundColor} border-none shadow-sm rounded-xl`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-semibold text-sm ${block.textColor}`}>
                    {block.label}
                  </h4>
                  {block.timestamp && (
                    <div className="text-right">
                      <div className={`text-sm ${block.textColor} opacity-90`}>
                        {block.timestamp}
                      </div>
                      {block.amount && (
                        <div className={`text-sm font-medium ${block.textColor} opacity-90`}>
                          {block.amount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="ml-4">
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={photoUrl} />
                  <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                    {userType === 'passenger' ? 'P' : 'D'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {statusBlocks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No status updates yet
        </div>
      )}
    </div>
  );
};
