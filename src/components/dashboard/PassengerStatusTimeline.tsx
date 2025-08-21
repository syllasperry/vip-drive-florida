
import { EnhancedStatusTimeline } from "./EnhancedStatusTimeline";

interface PassengerStatusTimelineProps {
  booking: any;
  onReopenModal?: (status: string) => void;
}

export const PassengerStatusTimeline = ({ 
  booking, 
  onReopenModal 
}: PassengerStatusTimelineProps) => {
  if (!booking?.id) {
    console.log('❌ PassengerStatusTimeline: No booking provided');
    return null;
  }

  console.log('🔍 PassengerStatusTimeline Debug - Full booking data:', {
    booking_id: booking.id,
    booking,
    onReopenModal: !!onReopenModal,
    booking_status: booking.status,
    payment_status: booking.payment_confirmation_status,
    passenger_data: {
      name: booking.passengers?.full_name,
      photo: booking.passengers?.profile_photo_url
    },
    driver_data: {
      name: booking.drivers?.full_name,
      photo: booking.drivers?.profile_photo_url
    }
  });

  return (
    <EnhancedStatusTimeline
      booking={booking}
      userType="passenger"
      onReopenModal={onReopenModal}
    />
  );
};
