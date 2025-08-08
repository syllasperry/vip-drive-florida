
import { StatusTimeline } from "@/components/timeline/StatusTimeline";
import { ReopenModalButton } from "./ReopenModalButton";

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
    <div className="space-y-4">
      {/* Reopen Modal Button */}
      {onReopenModal && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
          <ReopenModalButton
            booking={booking}
            userType="passenger"
            onReopenModal={onReopenModal}
          />
        </div>
      )}
      
      <StatusTimeline
        bookingId={booking.id}
        userType="passenger"
        userPhotoUrl={booking.passengers?.profile_photo_url}
        otherUserPhotoUrl={booking.drivers?.profile_photo_url}
      />
    </div>
  );
};
