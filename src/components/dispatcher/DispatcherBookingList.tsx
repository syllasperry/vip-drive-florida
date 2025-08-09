
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Users, Car, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from "@/types/booking";

interface DispatcherBookingListProps {
  bookings: Booking[];
  onUpdate: () => void;
}

export const DispatcherBookingList = ({ bookings, onUpdate }: DispatcherBookingListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booking_requested': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'payment_pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'all_set': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booking_requested': return 'New Request';
      case 'payment_pending': return 'Offer Sent to Passenger';
      case 'all_set': return 'All Set';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-500">New ride requests will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">All Bookings</h2>
        <p className="text-gray-600">Manage ride requests and assignments</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">#{booking.id.slice(-8).toUpperCase()}</span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.simple_status)}`}>
                  {getStatusLabel(booking.simple_status)}
                </Badge>
              </div>

              {/* Passenger Info */}
              {booking.passengers && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Passenger</p>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={booking.passengers.profile_photo_url} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {booking.passengers.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{booking.passengers.full_name}</p>
                      <p className="text-sm text-gray-500">{booking.passengers.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Locations */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="text-sm font-medium text-gray-900">{booking.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-gray-500">Drop-off</p>
                    <p className="text-sm font-medium text-gray-900">{booking.dropoff_location}</p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {formatDateTime(booking.pickup_time)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">
                    {booking.passenger_count} passengers
                  </span>
                </div>
                {booking.vehicle_type && (
                  <div className="flex items-center space-x-2 col-span-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{booking.vehicle_type}</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-red-600">
                  ${booking.final_price || booking.estimated_price || 0}
                </span>
              </div>

              {/* Driver Info - Only show when manually assigned by dispatcher */}
              {booking.drivers && booking.driver_id && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Assigned Driver</p>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={booking.drivers.profile_photo_url} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {booking.drivers.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{booking.drivers.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {booking.drivers.car_make} {booking.drivers.car_model} - {booking.drivers.license_plate}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
