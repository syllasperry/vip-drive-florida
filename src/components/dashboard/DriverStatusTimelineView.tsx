
import React from 'react';
import { ComprehensiveStatusTimeline } from "@/components/timeline/ComprehensiveStatusTimeline";
import { ReopenModalButton } from "./ReopenModalButton";

interface DriverStatusTimelineViewProps {
  booking: any;
  onReopenModal?: (status: string) => void;
}

export const DriverStatusTimelineView = ({ 
  booking, 
  onReopenModal 
}: DriverStatusTimelineViewProps) => {
  if (!booking?.id) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with Reopen Modal Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
        {onReopenModal && (
          <ReopenModalButton
            booking={booking}
            userType="driver"
            onReopenModal={onReopenModal}
            className="ml-2"
          />
        )}
      </div>
      
      <ComprehensiveStatusTimeline
        bookingId={booking.id}
        userType="driver"
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
    </div>
  );
};
