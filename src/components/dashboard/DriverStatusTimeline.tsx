
import React from 'react';
import { StatusTimeline } from '@/components/timeline/StatusTimeline';

interface DriverStatusTimelineProps {
  booking: any;
  className?: string;
}

export const DriverStatusTimeline = ({ 
  booking, 
  className = "" 
}: DriverStatusTimelineProps) => {
  if (!booking?.id) {
    return null;
  }

  return (
    <StatusTimeline
      bookingId={booking.id}
      userType="driver"
      userPhotoUrl={booking.drivers?.profile_photo_url}
      otherUserPhotoUrl={booking.passengers?.profile_photo_url}
      className={className}
    />
  );
};
