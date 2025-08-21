
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { BookingLifecycleTimeline } from '@/components/timeline/BookingLifecycleTimeline';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, User, Car, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Booking } from '@/lib/types/booking';
import { fetchBookingHistory, subscribeBookingHistory, BookingHistoryEntry } from '@/lib/passenger/api';

export interface EnhancedStatusTimelineProps {
  booking: Booking;
  userType: 'passenger' | 'driver';
  onReopenModal?: (status: string) => void;
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
    case 'driver_accepted':
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

const formatStatusForDisplay = (status: string, metadata?: any) => {
  const statusMap: Record<string, string> = {
    'pending': 'Booking Request Submitted',
    'driver_assigned': 'Driver Assigned',
    'driver_accepted': 'Driver Accepted Request',
    'offer_sent': 'Price Offer Sent',
    'offer_accepted': 'Offer Accepted by Passenger',
    'payment_requested': 'Payment Requested',
    'payment_confirmed': 'Payment Confirmed',
    'all_set': 'All Set - Ready to Go',
    'in_progress': 'Ride in Progress',
    'completed': 'Ride Completed',
    'cancelled': 'Booking Cancelled'
  };
  
  let displayText = statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  if (metadata?.final_price) {
    displayText += ` ($${metadata.final_price})`;
  }
  
  return displayText;
};

export const EnhancedStatusTimeline: React.FC<EnhancedStatusTimelineProps> = ({ 
  booking, 
  userType, 
  onReopenModal 
}) => {
  const [activeTab, setActiveTab] = useState('current');
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking?.id) return;

    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const history = await fetchBookingHistory(booking.id);
        setBookingHistory(history);
      } catch (error) {
        console.error('Error loading booking history:', error);
        setHistoryError('Failed to load booking history');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();

    // Subscribe to real-time history updates
    const unsubscribe = subscribeBookingHistory(booking.id, (updatedHistory) => {
      setBookingHistory(updatedHistory);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [booking?.id]);

  if (!booking?.id) {
    console.log('❌ EnhancedStatusTimeline: No booking provided');
    return null;
  }

  console.log('🔍 EnhancedStatusTimeline Debug:', {
    booking_id: booking.id,
    userType,
    onReopenModal: !!onReopenModal,
    booking_status: booking.status,
    payment_status: booking.payment_confirmation_status,
    history_count: bookingHistory.length
  });

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Status</TabsTrigger>
          <TabsTrigger value="timeline">Full Timeline ({bookingHistory.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="mt-4">
          <StatusTimeline 
            bookingId={booking.id}
            userType={userType}
            userPhotoUrl={userType === 'passenger' ? booking.passenger_photo_url || booking.passenger_avatar_url : booking.driver_photo_url || booking.driver_avatar_url}
            otherUserPhotoUrl={userType === 'passenger' ? booking.driver_photo_url || booking.driver_avatar_url : booking.passenger_photo_url || booking.passenger_avatar_url}
          />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
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
              ) : historyError ? (
                <div className="text-center text-red-500 py-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  {historyError}
                </div>
              ) : bookingHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  No history events yet
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingHistory.map((entry, index) => (
                    <div key={`${entry.created_at}-${index}`} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(entry.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {formatStatusForDisplay(entry.status, entry.metadata)}
                          </p>
                          {entry.role && (
                            <Badge className={`text-xs ${
                              entry.role === 'passenger' ? 'bg-blue-100 text-blue-800' :
                              entry.role === 'driver' ? 'bg-green-100 text-green-800' :
                              entry.role === 'dispatcher' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {entry.role.charAt(0).toUpperCase() + entry.role.slice(1)}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "MMM d, h:mm a")}
                        </p>
                        
                        {entry.metadata?.message && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            "{entry.metadata.message}"
                          </p>
                        )}
                      </div>

                      {index < bookingHistory.length - 1 && (
                        <div className="absolute left-7 mt-8 w-px h-6 bg-gray-200" style={{ marginLeft: '-12px' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
