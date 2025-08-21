
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckCircle, AlertCircle, User, Car, DollarSign, MapPin } from "lucide-react";
import { useBookingHistory } from "@/hooks/useBookingHistory";
import { BookingTimelineEvent } from "@/lib/history/api";
import { format } from "date-fns";

interface BookingLifecycleTimelineProps {
  bookingId: string;
  userType?: 'passenger' | 'driver' | 'dispatcher';
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
    case 'requested':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'driver_assigned':
    case 'assigned':
    case 'driver_accepted':
      return <Car className="h-4 w-4 text-blue-500" />;
    case 'offer_sent':
    case 'payment_requested':
      return <DollarSign className="h-4 w-4 text-purple-500" />;
    case 'payment_confirmed':
    case 'offer_accepted':
    case 'all_set':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'ride_started':
    case 'in_transit':
      return <MapPin className="h-4 w-4 text-blue-600" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'cancelled':
    case 'declined':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'all_set':
    case 'payment_confirmed':
      return 'bg-green-100 text-green-800';
    case 'offer_sent':
    case 'payment_requested':
      return 'bg-purple-100 text-purple-800';
    case 'driver_assigned':
    case 'ride_started':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
    case 'declined':
      return 'bg-red-100 text-red-800';
    case 'pending':
    case 'requested':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRoleBadge = (role?: string | null) => {
  if (!role) return null;
  
  const colors = {
    passenger: 'bg-blue-100 text-blue-800',
    driver: 'bg-green-100 text-green-800',
    dispatcher: 'bg-purple-100 text-purple-800',
    system: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <Badge className={`${colors[role as keyof typeof colors] || colors.system} text-xs`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};

const formatTimelineStatus = (status: string, metadata?: Record<string, any>) => {
  // Format status into human-readable text
  const statusMap: Record<string, string> = {
    'pending': 'Booking Request Submitted',
    'driver_assigned': 'Driver Assigned',
    'driver_accepted': 'Driver Accepted Request',
    'offer_sent': 'Price Offer Sent',
    'offer_accepted': 'Offer Accepted by Passenger',
    'payment_requested': 'Payment Requested',
    'payment_confirmed': 'Payment Confirmed',
    'all_set': 'All Set - Ready to Go',
    'ride_started': 'Ride Started',
    'in_transit': 'In Transit',
    'completed': 'Ride Completed',
    'cancelled': 'Booking Cancelled',
    'declined': 'Request Declined'
  };
  
  let displayText = statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Add price info if available
  if (metadata?.final_price) {
    displayText += ` ($${metadata.final_price})`;
  }
  
  return displayText;
};

export const BookingLifecycleTimeline: React.FC<BookingLifecycleTimelineProps> = ({
  bookingId,
  userType = 'passenger',
  className = ""
}) => {
  const { timeline, loading, error } = useBookingHistory(bookingId);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            Error loading timeline: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            No timeline events yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id || index} className="flex items-start space-x-3">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(event.status)}
              </div>
              
              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">
                    {formatTimelineStatus(event.status, event.metadata)}
                  </p>
                  {getRoleBadge(event.role)}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.created_at), "MMM d, h:mm a")}
                </p>
                
                {/* Additional metadata */}
                {event.metadata?.message && (
                  <p className="text-xs text-gray-600 mt-1 italic">
                    "{event.metadata.message}"
                  </p>
                )}
              </div>

              {/* Timeline connector */}
              {index < timeline.length - 1 && (
                <div className="absolute left-7 mt-8 w-px h-6 bg-gray-200" style={{ marginLeft: '-12px' }} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
