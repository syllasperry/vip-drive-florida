
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface StandardDriverRideCardProps {
  booking: any;
}

export const StandardDriverRideCard: React.FC<StandardDriverRideCardProps> = ({
  booking
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium">Ride Request</h3>
            <p className="text-sm text-gray-600">From: {booking.pickup_location}</p>
            <p className="text-sm text-gray-600">To: {booking.dropoff_location}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">${booking.final_price || booking.estimated_price || 'TBD'}</span>
            <Button size="sm" variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
