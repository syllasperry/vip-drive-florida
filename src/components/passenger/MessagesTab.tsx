
import { useState } from "react";
import { MessagingInterface } from "@/components/MessagingInterface";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Clock } from "lucide-react";

interface MessagesTabProps {
  bookings: any[];
  currentUserId: string;
  currentUserName: string;
}

export const MessagesTab = ({ bookings, currentUserId, currentUserName }: MessagesTabProps) => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showMessaging, setShowMessaging] = useState(false);

  // Filter bookings that have assigned drivers for messaging
  const messagingBookings = bookings.filter(booking => 
    booking.driver_id && 
    ['payment_pending', 'all_set', 'in_progress'].includes(booking.simple_status)
  );

  const handleOpenChat = (booking: any) => {
    setSelectedBooking(booking);
    setShowMessaging(true);
  };

  if (showMessaging && selectedBooking) {
    return (
      <MessagingInterface
        bookingId={selectedBooking.id}
        userType="passenger"
        isOpen={true}
        onClose={() => setShowMessaging(false)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        otherUserName={selectedBooking.driver_profiles?.full_name}
        otherUserAvatar={selectedBooking.driver_profiles?.profile_photo_url}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      
      {messagingBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active conversations</h3>
          <p className="text-gray-500">Messages will appear here once you have active bookings with assigned drivers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messagingBookings.map((booking) => (
            <Card 
              key={booking.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenChat(booking)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-red-500" />
                      <span className="font-medium text-gray-900">
                        {booking.driver_profiles?.full_name || 'Your Driver'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Booking #{booking.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.pickup_location.split(',')[0]} → {booking.dropoff_location.split(',')[0]}
                    </p>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
