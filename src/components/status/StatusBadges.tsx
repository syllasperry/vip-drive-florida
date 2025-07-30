import { Badge } from "@/components/ui/badge";

interface StatusBadgesProps {
  rideStatus: string;
  paymentStatus: string;
  className?: string;
}

export const StatusBadges = ({ rideStatus, paymentStatus, className = "" }: StatusBadgesProps) => {
  const getRideStatusConfig = (status: string) => {
    switch (status) {
      case 'pending_driver':
        return { text: 'Pending Driver', color: 'bg-yellow-100/80 text-yellow-800 border-yellow-200' };
      case 'offer_sent':
        return { text: 'Offer Sent', color: 'bg-blue-100/80 text-blue-800 border-blue-200' };
      case 'confirmed':
        return { text: 'Confirmed', color: 'bg-green-100/80 text-green-800 border-green-200' };
      case 'in_progress':
        return { text: 'In Progress', color: 'bg-purple-100/80 text-purple-800 border-purple-200' };
      case 'completed':
        return { text: 'Completed', color: 'bg-gray-100/80 text-gray-800 border-gray-200' };
      case 'canceled':
        return { text: 'Canceled', color: 'bg-red-100/80 text-red-800 border-red-200' };
      default:
        return { text: status, color: 'bg-muted/10 text-muted-foreground border-border' };
    }
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting_for_offer':
        return { text: 'Waiting for offer', color: 'bg-gray-50/80 text-gray-600 border-gray-200' };
      case 'price_awaiting_acceptance':
        return { text: 'Price awaiting acceptance', color: 'bg-orange-50/80 text-orange-700 border-orange-200' };
      case 'waiting_for_payment':
        return { text: 'Waiting for payment', color: 'bg-yellow-50/80 text-yellow-700 border-yellow-200' };
      case 'passenger_paid':
        return { text: 'Passenger paid', color: 'bg-blue-50/80 text-blue-700 border-blue-200' };
      case 'awaiting_driver_confirmation':
        return { text: 'Awaiting driver confirmation', color: 'bg-purple-50/80 text-purple-700 border-purple-200' };
      case 'all_set':
        return { text: 'All Set ✅', color: 'bg-emerald-50/80 text-emerald-700 border-emerald-200' };
      default:
        return { text: status, color: 'bg-muted/10 text-muted-foreground border-border' };
    }
  };

  const rideConfig = getRideStatusConfig(rideStatus);
  const paymentConfig = getPaymentStatusConfig(paymentStatus);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Badge className={`${rideConfig.color} text-xs font-medium`}>
        {rideConfig.text}
      </Badge>
      <Badge className={`${paymentConfig.color} text-xs font-medium`}>
        {paymentConfig.text}
      </Badge>
    </div>
  );
};