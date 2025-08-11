
import React from 'react';
import { StatusTimeline } from './StatusTimeline';

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

export const ComprehensiveStatusTimeline: React.FC<ComprehensiveStatusTimelineProps> = ({
  bookingId,
  userType,
  passengerData,
  driverData,
  finalPrice,
  className = ""
}) => {
  const userPhotoUrl = userType === 'passenger' ? passengerData?.photo_url : driverData?.photo_url;
  const otherUserPhotoUrl = userType === 'passenger' ? driverData?.photo_url : passengerData?.photo_url;

  return (
    <StatusTimeline
      bookingId={bookingId}
      userType={userType}
      userPhotoUrl={userPhotoUrl}
      otherUserPhotoUrl={otherUserPhotoUrl}
      className={className}
    />
  );
};
