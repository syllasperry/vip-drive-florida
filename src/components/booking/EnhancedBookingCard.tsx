
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadges } from "@/components/status/StatusBadges";

interface EnhancedBookingCardProps {
  booking: any;
  onReopenAlert?: () => void;
}

export const EnhancedBookingCard: React.FC<EnhancedBookingCardProps> = ({
  booking,
  onReopenAlert
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Booking Details</h3>
            <p className="text-sm text-gray-600">From: {booking.pickup_location}</p>
            <p className="text-sm text-gray-600">To: {booking.dropoff_location}</p>
          </div>
          
          <StatusBadges
            status={booking.status}
            paymentStatus={booking.payment_confirmation_status}
            onReopenAlert={onReopenAlert}
            showReopenButton={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};
