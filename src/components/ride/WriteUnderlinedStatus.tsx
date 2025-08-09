
import { Badge } from "@/components/ui/badge";

interface WriteUnderlinedStatusProps {
  booking: any;
  userType: 'passenger' | 'driver' | 'dispatcher';
}

export const WriteUnderlinedStatus = ({ booking, userType }: WriteUnderlinedStatusProps) => {
  const getStatusDisplay = () => {
    if (!booking) return { text: 'Unknown', color: 'gray' };

    const status = booking.status || booking.ride_status || 'pending';
    
    switch (status) {
      case 'pending':
        return { text: 'Pending', color: 'orange' };
      case 'offer_sent':
        return { text: 'Offer Sent', color: 'blue' };
      case 'accepted':
      case 'all_set':
        return { text: 'Confirmed', color: 'green' };
      case 'completed':
        return { text: 'Completed', color: 'gray' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'red' };
      default:
        return { text: status, color: 'gray' };
    }
  };

  const { text, color } = getStatusDisplay();

  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Badge className={`${colorClasses[color]} border font-medium`}>
      {text}
    </Badge>
  );
};
