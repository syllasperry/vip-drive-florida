
import React from 'react';
import { StatusTimeline } from "@/components/timeline/StatusTimeline";
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
      {/* Reopen Modal Button */}
      {onReopenModal && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
          <ReopenModalButton
            booking={booking}
            userType="driver"
            onReopenModal={onReopenModal}
          />
        </div>
      )}
      
      <StatusTimeline
        bookingId={booking.id}
        userType="driver"
        userPhotoUrl={booking.drivers?.profile_photo_url}
        otherUserPhotoUrl={booking.passengers?.profile_photo_url}
      />
    </div>
  );
};
