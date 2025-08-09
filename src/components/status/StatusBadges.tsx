
import { Badge } from "@/components/ui/badge";
import { ReopenModalButton } from "../dashboard/ReopenModalButton";

interface StatusBadgesProps {
  booking: any;
  userType: 'passenger' | 'driver' | 'dispatcher';
  onReopenAlert?: () => void;
  showReopenButton?: boolean;
}

export const StatusBadges = ({ booking, userType, onReopenAlert, showReopenButton }: StatusBadgesProps) => {
  const getStatusBadgeInfo = () => {
    const rideStatus = booking.ride_status || booking.status;
    const paymentStatus = booking.payment_confirmation_status || "waiting_for_offer";

    if (paymentStatus === 'all_set') {
      return { label: 'All Set', color: 'bg-green-100 text-green-800' };
    }
    
    if (paymentStatus === 'passenger_paid') {
      return { label: 'Payment Received', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (rideStatus === 'offer_sent' || paymentStatus === 'price_awaiting_acceptance') {
      return { label: 'Offer Sent', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    if (rideStatus === 'pending_driver' || paymentStatus === 'waiting_for_offer') {
      return { label: 'Waiting for Driver', color: 'bg-orange-100 text-orange-800' };
    }
    
    return { label: 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const statusInfo = getStatusBadgeInfo();

  return (
    <div className="flex items-center gap-2">
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
      {showReopenButton && (
        <ReopenModalButton 
          booking={booking} 
          onReopenModal={(step: string) => onReopenAlert?.()} 
        />
      )}
    </div>
  );
};
