
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, AlertCircle } from 'lucide-react';
import { BookingLifecycleTimeline } from '@/components/timeline/BookingLifecycleTimeline';

interface BookingData {
  id: string;
  status?: string;
  passenger_status?: string;
  driver_status?: string;
  payment_status?: string;
  ride_status?: string;
  created_at: string;
  updated_at?: string;
}

interface EnhancedStatusTimelineProps {
  booking: BookingData;
  userType: "driver" | "passenger"; // Removed "dispatcher" to fix TypeScript error
}

export const EnhancedStatusTimeline: React.FC<EnhancedStatusTimelineProps> = ({
  booking,
  userType
}) => {
  const [activeTab, setActiveTab] = useState("current");

  const getCurrentStatus = () => {
    if (userType === "passenger") {
      return booking.passenger_status || booking.status || "pending";
    }
    return booking.driver_status || booking.status || "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Booking Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Status</TabsTrigger>
            <TabsTrigger value="timeline">Full Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Status:</span>
                <Badge className={getStatusColor(getCurrentStatus())}>
                  {getCurrentStatus()}
                </Badge>
              </div>
              
              {booking.payment_status && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment:</span>
                  <Badge className={getStatusColor(booking.payment_status)}>
                    {booking.payment_status}
                  </Badge>
                </div>
              )}
              
              {booking.ride_status && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ride:</span>
                  <Badge className={getStatusColor(booking.ride_status)}>
                    {booking.ride_status}
                  </Badge>
                </div>
              )}
              
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <User className="w-4 h-4" />
                Last updated: {new Date(booking.updated_at || booking.created_at).toLocaleString()}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-4">
            <BookingLifecycleTimeline 
              bookingId={booking.id}
              userType={userType}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
