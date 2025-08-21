
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, MapPin, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { BookingChatModal } from '@/components/chat/BookingChatModal';
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback';
import { format } from 'date-fns';

interface UniversalRideCardProps {
  booking: any;
  userType: 'dispatcher' | 'passenger';
  onUpdate?: () => void;
}

export const UniversalRideCard: React.FC<UniversalRideCardProps> = ({
  booking,
  userType,
  onUpdate
}) => {
  const [showChat, setShowChat] = useState(false);

  const handleChatClick = () => {
    setShowChat(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'offer_sent':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><AlertCircle className="w-3 h-3 mr-1" />Review Offer</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className="w-full mb-4 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          
          <div className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-start space-x-4 mb-4">
              <div className="relative inline-block">
                <AvatarWithFallback 
                  src={userType === 'passenger' ? booking.passenger_avatar_url : booking.passenger_photo_url} 
                  fullName={userType === 'passenger' ? booking.passenger_name : `${booking.passenger_first_name || ''} ${booking.passenger_last_name || ''}`.trim()} 
                  size="md" 
                />
                {booking.driver_name && (
                  <div className="absolute -bottom-1 -right-1 border-2 border-white rounded-full">
                    <AvatarWithFallback 
                      src={booking.driver_avatar_url || booking.driver_photo_url} 
                      fullName={booking.driver_name} 
                      size="sm" 
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {userType === 'passenger' 
                    ? (booking.passenger_name || 'VIP Passenger')
                    : (`${booking.passenger_first_name || ''} ${booking.passenger_last_name || ''}`.trim() || 'VIP Passenger')
                  }
                </div>
                {booking.driver_name && (
                  <div className="text-xs text-blue-600">
                    Driver: {booking.driver_name}
                  </div>
                )}
              </div>
              {getStatusBadge(booking.status)}
            </div>

            {/* Pickup and Drop-off */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">Pickup</div>
                  <div className="text-gray-600 text-sm">{booking.pickup_location}</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">Drop-off</div>
                  <div className="text-gray-600 text-sm">{booking.dropoff_location}</div>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              {booking.price_dollars && (
                <div className="text-lg font-bold text-green-600">
                  ${booking.price_dollars}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleChatClick}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Modal - only show for passenger and dispatcher roles */}
      {showChat && (userType === 'dispatcher' || userType === 'passenger') && (
        <BookingChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          bookingId={booking.id}
          role={userType}
        />
      )}
    </>
  );
};
