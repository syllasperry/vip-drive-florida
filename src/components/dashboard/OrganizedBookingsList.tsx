
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { StandardDriverRideCard } from "../StandardDriverRideCard";
import { EnhancedBookingCard } from "../booking/EnhancedBookingCard";
import { MessagingInterface } from "../MessagingInterface";
import { BookingSummaryModal } from "../BookingSummaryModal";
import { PaymentModal } from "../payment/PaymentModal";
import { BookingRequestModal } from "../booking/BookingRequestModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mapToSimpleStatus } from "@/utils/bookingHelpers";

interface OrganizedBookingsListProps {
  userType: 'passenger' | 'driver';
  onRefresh?: () => void;
}

export const OrganizedBookingsList = ({ userType, onRefresh }: OrganizedBookingsListProps) => {
  const { bookings, loading, refreshBookings } = useRealtimeBookings(userType);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [bookings, onRefresh]);

  const handleUpdate = () => {
    refreshBookings();
    if (onRefresh) {
      onRefresh();
    }
  };

  const organizeBookings = () => {
    const organized = {
      requests: [] as any[],
      active: [] as any[],
      completed: [] as any[]
    };

    bookings.forEach(booking => {
      const simpleStatus = mapToSimpleStatus(booking);
      
      if (simpleStatus === 'booking_requested' || simpleStatus === 'payment_pending') {
        organized.requests.push(booking);
      } else if (simpleStatus === 'all_set') {
        organized.active.push(booking);
      } else if (simpleStatus === 'completed' || simpleStatus === 'cancelled') {
        organized.completed.push(booking);
      }
    });

    return organized;
  };

  const organized = organizeBookings();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Loading bookings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">
            Requests ({organized.requests.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({organized.active.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({organized.completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {organized.requests.length > 0 ? (
            organized.requests.map((booking) => (
              userType === 'driver' ? (
                <StandardDriverRideCard
                  key={booking.id}
                  booking={booking}
                  onUpdate={handleUpdate}
                  onMessagePassenger={() => {
                    setSelectedBooking(booking);
                    setShowMessaging(true);
                  }}
                />
              ) : (
                <EnhancedBookingCard
                  key={booking.id}
                  booking={booking}
                  userType={userType}
                  onMessage={() => {
                    setSelectedBooking(booking);
                    setShowMessaging(true);
                  }}
                  onViewSummary={() => {
                    setSelectedBooking(booking);
                    setShowSummary(true);
                  }}
                  onEditPrice={() => {
                    setSelectedBooking(booking);
                    setShowRequestModal(true);
                  }}
                />
              )
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No pending requests
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {organized.active.length > 0 ? (
            organized.active.map((booking) => (
              <EnhancedBookingCard
                key={booking.id}
                booking={booking}
                userType={userType}
                onMessage={() => {
                  setSelectedBooking(booking);
                  setShowMessaging(true);
                }}
                onViewSummary={() => {
                  setSelectedBooking(booking);
                  setShowSummary(true);
                }}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No active rides
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {organized.completed.length > 0 ? (
            organized.completed.map((booking) => (
              <EnhancedBookingCard
                key={booking.id}
                booking={booking}
                userType={userType}
                onMessage={() => {
                  setSelectedBooking(booking);
                  setShowMessaging(true);
                }}
                onViewSummary={() => {
                  setSelectedBooking(booking);
                  setShowSummary(true);
                }}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No completed rides
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showMessaging && selectedBooking && (
        <MessagingInterface
          bookingId={selectedBooking.id}
          userType={userType}
          onClose={() => setShowMessaging(false)}
        />
      )}

      {showSummary && selectedBooking && (
        <BookingSummaryModal
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          booking={selectedBooking}
        />
      )}

      {showPayment && selectedBooking && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          booking={selectedBooking}
          onUpdate={handleUpdate}
        />
      )}

      {showRequestModal && selectedBooking && (
        <BookingRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          booking={selectedBooking}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};
