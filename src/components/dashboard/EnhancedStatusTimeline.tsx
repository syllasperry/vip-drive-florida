
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { BookingLifecycleTimeline } from '@/components/timeline/BookingLifecycleTimeline';

export interface EnhancedStatusTimelineProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onReopenModal?: (status: string) => void;
}

export const EnhancedStatusTimeline: React.FC<EnhancedStatusTimelineProps> = ({ 
  booking, 
  userType, 
  onReopenModal 
}) => {
  const [activeTab, setActiveTab] = useState('current');

  if (!booking?.id) {
    console.log('❌ EnhancedStatusTimeline: No booking provided');
    return null;
  }

  console.log('🔍 EnhancedStatusTimeline Debug:', {
    booking_id: booking.id,
    userType,
    onReopenModal: !!onReopenModal,
    booking_status: booking.status,
    payment_status: booking.payment_confirmation_status
  });

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Status</TabsTrigger>
          <TabsTrigger value="timeline">Full Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="mt-4">
          <StatusTimeline 
            booking={booking}
            userType={userType}
            onReopenModal={onReopenModal}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          <BookingLifecycleTimeline
            bookingId={booking.id}
            userType={userType}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
