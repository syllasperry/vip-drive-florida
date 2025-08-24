
import React, { useState } from "react";
import { useMyBookings } from "@/hooks/useMyBookings";
import { useReviewNotifications } from "@/hooks/useReviewNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Car, Star, MessageCircle, Phone } from "lucide-react";
import { AirbnbStyleReviewModal } from "@/components/review/AirbnbStyleReviewModal";

export const PassengerBookingsList = () => {
  const { data: bookings = [], isLoading, error } = useMyBookings();
  const { data: reviewNotifications = [] } = useReviewNotifications();
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load bookings</p>
        </CardContent>
      </Card>
    );
  }

  // Find bookings that need reviews
  const bookingsNeedingReview = reviewNotifications.map(notification => {
    const booking = bookings.find(b => b.booking_id === notification.booking_id);
    return booking ? { ...booking, reviewNotification: notification } : null;
  }).filter(Boolean);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'offer_sent': return 'bg-blue-100 text-blue-800';
      case 'all_set': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPrice = (priceCents: number | null, currency = 'USD') => {
    if (!priceCents) return 'Price TBD';
    return `$${(priceCents / 100).toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Review Requests Section */}
      {bookingsNeedingReview.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Review Your Recent Rides
          </h3>
          
          {bookingsNeedingReview.map((booking) => (
            <Card key={`review-${booking.booking_id}`} className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">How was your ride?</h4>
                      <p className="text-sm text-muted-foreground">
                        Trip #{booking.booking_code} • {new Date(booking.pickup_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setSelectedBookingForReview(booking)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Leave Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Bookings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Bookings</h3>
        
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground">
                Your ride history will appear here once you make your first booking.
              </p>
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.booking_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Trip #{booking.booking_code}</CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {formatStatus(booking.status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary">
                      {formatPrice(booking.price_cents, booking.currency)}
                    </p>
                    {booking.distance_miles && (
                      <p className="text-sm text-muted-foreground">
                        {booking.distance_miles.toFixed(1)} miles
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid gap-4">
                  {/* Trip Details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">From</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.pickup_location}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">To</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.dropoff_location}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">Pickup Time</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.pickup_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {booking.vehicle_type && (
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-sm">Vehicle</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.vehicle_type}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Driver Info */}
                  {booking.driver_id && booking.driver_name && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.driver_avatar_url} />
                          <AvatarFallback>
                            {booking.driver_name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">Your Driver</p>
                          <p className="text-sm text-muted-foreground">{booking.driver_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedBookingForReview && (
        <AirbnbStyleReviewModal
          isOpen={true}
          onClose={() => setSelectedBookingForReview(null)}
          booking={selectedBookingForReview}
        />
      )}
    </div>
  );
};
