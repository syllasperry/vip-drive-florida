import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Car, Phone, Users, HelpCircle, X } from 'lucide-react';

interface BookingInfo {
  id: string;
  booking_code?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  status: string;
  vehicle_type?: string;
  distance_miles?: number;
  created_at: string;
  updated_at?: string;
  passenger_phone?: string;
}

interface RideRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingInfo;
  onCancelRide?: (bookingId: string) => void;
}

export const RideRequestDetailsModal: React.FC<RideRequestDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCancelRide
}) => {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  
  const isPendingStatus = booking.status?.toLowerCase() === 'pending' || 
                         booking.status?.toLowerCase() === 'awaiting_driver_assignment' ||
                         booking.status?.toLowerCase() === 'waiting_for_driver';

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEstimatedDuration = () => {
    if (booking.distance_miles) {
      const hours = Math.floor(booking.distance_miles / 65); // Assuming ~65 mph average
      const minutes = Math.round((booking.distance_miles / 65 - hours) * 60);
      return `~${hours}h ${minutes}m drive`;
    }
    return null;
  };

  const handleCancelClick = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = () => {
    if (onCancelRide) {
      onCancelRide(booking.id);
      setShowCancelConfirmation(false);
      onClose();
    }
  };

  const handleCancelConfirmationClose = () => {
    setShowCancelConfirmation(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Your Ride Request Details
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Trip Summary */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🧾 Trip Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Code:</span>
                  <span className="font-medium">
                    #{booking.booking_code || booking.id.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    <span>Awaiting driver assignment</span>
                    <span className="text-lg">⏳</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created at:</span>
                  <span className="font-medium">{formatDateTime(booking.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last update:</span>
                  <span className="font-medium">Waiting for driver offer</span>
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                📍 Route
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Pickup Location:</p>
                    <p className="text-sm text-gray-600">{booking.pickup_location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Drop-off Location:</p>
                    <p className="text-sm text-gray-600">{booking.dropoff_location}</p>
                  </div>
                </div>
                {(booking.distance_miles || getEstimatedDuration()) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                    <Clock className="h-4 w-4" />
                    {booking.distance_miles && (
                      <span>{Math.round(booking.distance_miles)} miles</span>
                    )}
                    {booking.distance_miles && getEstimatedDuration() && <span>•</span>}
                    {getEstimatedDuration()}
                  </div>
                )}
              </div>
            </div>

            {/* Requested Vehicle */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🚗 Requested Vehicle
              </h3>
              <div className="space-y-2 text-sm">
                {booking.vehicle_type && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{booking.vehicle_type}</span>
                  </div>
                )}
                {booking.passenger_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>Passenger Contact: {booking.passenger_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* What happens next */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                👀 What happens next?
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-800">
                  Your ride request has been sent to our dispatch team. A driver will review your trip details and send you a custom offer shortly.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">You'll receive:</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-2">
                    <li>• All ride details including driver's profile</li>
                    <li>• Vehicle and pricing information</li>
                    <li>• Driver's <strong>phone and email will be unlocked after payment</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Need help */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🛎️ Need help?
              </h3>
              <p className="text-sm text-gray-700">
                If you need to change or cancel your request, tap the red <strong>Cancel Ride Request</strong> button below or message our support team.
              </p>
            </div>

            {/* Cancel Button - Only show for pending bookings */}
            {isPendingStatus && onCancelRide && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleCancelClick}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  🔴 Cancel Ride Request
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Confirmation Modal */}
      <Dialog open={showCancelConfirmation} onOpenChange={handleCancelConfirmationClose}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Are you sure you want to cancel this ride request?
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-600 mb-6">
              This action will remove your request from the dashboard. If you change your mind later, you'll need to submit a new ride request.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={handleConfirmCancel}
                variant="destructive"
                className="flex-1"
              >
                🔴 Yes, Cancel Ride
              </Button>
              <Button
                onClick={handleCancelConfirmationClose}
                variant="outline"
                className="flex-1"
              >
                🔙 No, Go Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};