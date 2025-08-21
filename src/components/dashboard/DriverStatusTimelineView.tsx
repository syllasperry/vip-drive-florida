
import React from 'react';
import { EnhancedStatusTimeline } from "./EnhancedStatusTimeline";
import { Booking } from '@/lib/types/booking';

interface DriverStatusTimelineViewProps {
  booking: Booking;
  onReopenModal?: (status: string) => void;
}

export const DriverStatusTimelineView = ({ 
  booking, 
  onReopenModal 
}: DriverStatusTimelineViewProps) => {
  if (!booking?.id) {
    console.log('❌ DriverStatusTimelineView: No booking provided');
    return null;
  }

  console.log('🔍 DriverStatusTimelineView Debug - Full booking data:', {
    booking_id: booking.id,
    booking,
    onReopenModal: !!onReopenModal,
    booking_status: booking.status,
    payment_status: booking.payment_confirmation_status,
    passenger_data: {
      name: booking.passengers?.full_name || booking.passenger_name,
      photo: booking.passengers?.profile_photo_url || booking.passenger_photo_url
    },
    driver_data: {
      name: booking.drivers?.full_name || booking.driver_name,
      photo: booking.drivers?.profile_photo_url || booking.driver_photo_url
    }
  });

  return (
    <EnhancedStatusTimeline
      booking={booking}
      userType="driver"
      onReopenModal={onReopenModal}
    />
  );
};
