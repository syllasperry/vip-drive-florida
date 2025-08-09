
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/types/booking";
import { ReopenModalButton } from "../dashboard/ReopenModalButton";

interface StatusBadgesProps {
  booking: Booking;
  onReopenAlert: () => void;
  showReopenButton: boolean;
}

export const StatusBadges = ({ booking, onReopenAlert, showReopenButton }: StatusBadgesProps) => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'booking_requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending':
        return 'bg-orange-100 text-orange-800';
      case 'all_set':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booking_requested':
        return 'Requested';
      case 'payment_pending':
        return 'Payment Pending';
      case 'all_set':
        return 'All Set';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={getStatusBadgeColor(booking.simple_status || 'booking_requested')}>
        {getStatusLabel(booking.simple_status || 'booking_requested')}
      </Badge>
      {showReopenButton && (
        <ReopenModalButton 
          booking={booking} 
          onReopenModal={(step: string) => console.log('Reopen modal:', step)} 
        />
      )}
    </div>
  );
};
