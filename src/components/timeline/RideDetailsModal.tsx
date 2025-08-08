
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, Phone, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useBookingTimeline } from "@/hooks/useBookingTimeline";

interface RideDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export const RideDetailsModal = ({ isOpen, onClose, booking }: RideDetailsModalProps) => {
  const { timelineEvents, loading, error } = useBookingTimeline({ 
    bookingId: booking?.id,
    enabled: !!booking?.id && isOpen
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offer_sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'offer_accepted':
      case 'driver_accepted':
      case 'accepted_by_driver':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'payment_confirmed':
      case 'passenger_paid':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'all_set':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActorIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'driver':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'passenger':
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ride Details - {booking.id.slice(0, 8)}...
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Pickup:</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {booking.pickup_location || 'Not specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                    </div>
                    <span className="font-medium">Drop-off:</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {booking.dropoff_location || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {booking.passengers?.full_name || booking.passenger?.full_name || 'Passenger'}
                  </span>
                </div>
                
                {booking.passengers?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.passengers.phone}</span>
                  </div>
                )}
                
                {(booking.final_price || booking.estimated_price) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      ${booking.final_price || booking.estimated_price} USD
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {formatStatusLabel(booking.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Chronological Activity Log
              </h3>
              
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading timeline...
                </div>
              ) : error ? (
                <div className="text-center py-4 text-destructive">
                  Failed to load timeline
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No activity recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getActorIcon(event.role)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                            {formatStatusLabel(event.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        
                        <p className="text-sm text-foreground">
                          {event.role ? (
                            <>
                              <span className="font-medium capitalize">
                                {event.role}
                              </span>
                              {' '}updated status to{' '}
                              <span className="font-medium">
                                {formatStatusLabel(event.status)}
                              </span>
                            </>
                          ) : (
                            `Status updated to ${formatStatusLabel(event.status)}`
                          )}
                        </p>
                        
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 p-2 bg-background rounded border">
                            <details>
                              <summary className="cursor-pointer font-medium">
                                Additional Details
                              </summary>
                              <pre className="mt-1 whitespace-pre-wrap">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
