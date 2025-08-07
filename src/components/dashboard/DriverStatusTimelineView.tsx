
import { StatusTimeline } from "@/components/timeline/StatusTimeline";

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
    <StatusTimeline
      bookingId={booking.id}
      userType="driver"
      userPhotoUrl={booking.drivers?.profile_photo_url}
      otherUserPhotoUrl={booking.passengers?.profile_photo_url}
    />
  );
};
