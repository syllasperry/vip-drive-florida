
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface StatusBadgesProps {
  status?: string;
  paymentStatus?: string;
  onReopenAlert?: () => void;
  showReopenButton?: boolean;
}

export const StatusBadges: React.FC<StatusBadgesProps> = ({
  status = 'pending',
  paymentStatus = 'pending',
  onReopenAlert,
  showReopenButton = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-green-100 text-green-800'; // Green for paid status
      case 'OFFER_RECEIVED': return 'bg-blue-100 text-blue-800'; // Blue for offer received
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex gap-2">
      <Badge className={getStatusColor(status)}>
        {status === 'PAID' ? 'Paid' : status === 'OFFER_RECEIVED' ? 'Offer Received' : status}
      </Badge>
    </div>
  );
};
