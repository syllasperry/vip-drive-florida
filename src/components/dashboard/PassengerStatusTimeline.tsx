
import { ComprehensiveStatusTimeline } from "@/components/timeline/ComprehensiveStatusTimeline";
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
    <div className="space-y-4">
      {/* Header with Reopen Modal Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Ride Status</h3>
        {onReopenModal && (
          <ReopenModalButton
            booking={booking}
            userType="passenger"
            onReopenModal={onReopenModal}
            className="ml-2"
          />
        )}
      </div>
      
      <ComprehensiveStatusTimeline
        bookingId={booking.id}
        userType="passenger"
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
