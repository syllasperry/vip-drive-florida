
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingLifecycleTimeline } from "@/components/timeline/BookingLifecycleTimeline";
import { ComprehensiveStatusTimeline } from "@/components/timeline/ComprehensiveStatusTimeline";
import { ReopenModalButton } from "./ReopenModalButton";

interface EnhancedStatusTimelineProps {
  booking: any;
  userType: 'passenger' | 'driver' | 'dispatcher';
  onReopenModal?: (status: string) => void;
}

export const EnhancedStatusTimeline = ({ 
  booking, 
  userType,
  onReopenModal 
}: EnhancedStatusTimelineProps) => {
  if (!booking?.id) {
    console.log('❌ EnhancedStatusTimeline: No booking provided');
    return null;
  }

  console.log('🔍 EnhancedStatusTimeline Debug:', {
    booking_id: booking.id,
    userType,
    onReopenModal: !!onReopenModal,
  });

  return (
    <div className="space-y-4">
      {/* Header with Reopen Modal Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
        {onReopenModal && (
          <ReopenModalButton
            booking={booking}
            userType={userType}
            onReopenModal={onReopenModal}
            className="ml-2"
          />
        )}
      </div>
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Status</TabsTrigger>
          <TabsTrigger value="timeline">Full Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4">
          <ComprehensiveStatusTimeline
            bookingId={booking.id}
            userType={userType}
            passengerData={{
              name: booking.passengers?.full_name || 'Passenger',
              photo_url: booking.passengers?.profile_photo_url
            }}
            driverData={{
              name: booking.drivers?.full_name || 'Driver', 
              photo_url: booking.drivers?.profile_photo_url
            }}
            finalPrice={booking.final_price?.toString()}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="space-y-4">
          <BookingLifecycleTimeline
            bookingId={booking.id}
            userType={userType}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
