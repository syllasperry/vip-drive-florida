
import { StatusTimeline } from "@/components/timeline/StatusTimeline";

interface PassengerStatusTimelineProps {
  booking: any;
  onReopenModal?: (status: string) => void;
}

export const PassengerStatusTimeline = ({ 
  booking, 
  onReopenModal 
}: PassengerStatusTimelineProps) => {
  if (!booking?.id) {
    return null;
  }

  return (
    <StatusTimeline
      bookingId={booking.id}
      userType="passenger"
      userPhotoUrl={booking.passengers?.profile_photo_url}
      otherUserPhotoUrl={booking.drivers?.profile_photo_url}
    />
  );
};
