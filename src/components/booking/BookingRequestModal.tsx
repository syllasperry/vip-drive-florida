import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Phone, Music, Thermometer, MessageSquare, DollarSign, X, Map } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookingStatusPatterns } from "@/utils/bookingStatusUpdater";

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept: () => void;
  onReject: () => void;
  onSendOffer: () => void;
}

export const BookingRequestModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onAccept, 
  onReject, 
  onSendOffer 
}: BookingRequestModalProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [suggestedFare, setSuggestedFare] = useState(booking?.estimated_price || 100);
  const [editableFare, setEditableFare] = useState((booking?.estimated_price || 100).toString());
  const [validBooking, setValidBooking] = useState<any>(null);

  // Validate booking exists in database before showing modal
  useEffect(() => {
    const validateBooking = async () => {
      if (!booking?.id || !isOpen) {
        setValidBooking(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', booking.id)
          .eq('status', 'pending')
          .single();

        if (error || !data) {
          console.log('No valid booking found, closing modal');
          setValidBooking(null);
          onClose();
          return;
        }

        setValidBooking(data);
        
        // Calculate remaining time from database timestamp
        const createdAt = new Date(data.created_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - createdAt) / 1000);
        const remaining = Math.max(0, 600 - elapsed); // 10 minutes total
        
        if (remaining <= 0) {
          await handleExpireBooking(data.id);
          return;
        }
        
        setTimeLeft(remaining);
      } catch (error) {
        console.error('Error validating booking:', error);
        onClose();
      }
    };

    validateBooking();
  }, [booking?.id, isOpen, onClose]);

  if (!validBooking) return null;

  const passengerName = validBooking.passenger_name || 
    (validBooking.passenger_first_name && validBooking.passenger_last_name 
      ? `${validBooking.passenger_first_name} ${validBooking.passenger_last_name}`
      : "Passenger");

  // Auto-expire booking when countdown reaches zero
  const handleExpireBooking = async (bookingId: string) => {
    try {
      await supabase
        .from('bookings')
        .update({ 
          status: 'expired',
          ride_status: 'expired'
        })
        .eq('id', bookingId);

      toast({
        title: "Booking Expired",
        description: "This booking request has expired due to timeout.",
        variant: "destructive",
      });

      onClose();
    } catch (error) {
      console.error('Error expiring booking:', error);
    }
  };

  // Real-time countdown effect
  useEffect(() => {
    if (!validBooking || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleExpireBooking(validBooking.id);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [validBooking, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = format(date, "EEE, MMM d");
      const time = format(date, "HH:mm");
      return { day, time };
    } catch (error) {
      return { day: "Invalid date", time: "Invalid time" };
    }
  };

  const handleViewRoute = () => {
    const pickup = encodeURIComponent(validBooking.pickup_location);
    const dropoff = encodeURIComponent(validBooking.dropoff_location);
    const mapsUrl = `https://maps.google.com/maps?saddr=${pickup}&daddr=${dropoff}`;
    window.open(mapsUrl, '_blank');
  };

  const handleSendOfferClick = async () => {
    if (!editableFare || isNaN(Number(editableFare)) || Number(editableFare) <= 0) {
      toast({
        title: "Invalid Fare",
        description: "Please enter a valid fare amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the price fields first
      await supabase
        .from('bookings')
        .update({ 
          estimated_price: Number(editableFare),
          final_price: Number(editableFare)
        })
        .eq('id', validBooking.id);

      // Use the new status updater for consistent roadmap sync
      await BookingStatusPatterns.driverSendOffer(validBooking.id, Number(editableFare));

      toast({
        title: "Offer Sent",
        description: `Your offer of $${editableFare} has been sent to the passenger.`,
      });

      onSendOffer();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptClick = async () => {
    try {
      // Use the new status updater for consistent roadmap sync
      await BookingStatusPatterns.driverAccept(validBooking.id);

      toast({
        title: "Ride Accepted",
        description: "You have accepted this ride request.",
      });

      onAccept();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectClick = async () => {
    try {
      // Use the new status updater for consistent roadmap sync
      await BookingStatusPatterns.driverReject(validBooking.id);

      toast({
        title: "Ride Rejected",
        description: "You have rejected this ride request.",
      });

      onReject();
    } catch (error) {
      console.error('Error rejecting ride:', error);
      toast({
        title: "Error",
        description: "Failed to reject ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fix editable fare - remove leading zeros and allow clean editing
  const handleFareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');

    // Handle multiple decimal points
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
      value = value.replace(/\.(?=.*\.)/g, '');
    }

    // Remove leading zeros unless it's "0." for decimal values
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.replace(/^0+/, '');
    }

    // Prevent empty value from being just a decimal point
    if (value === '.') {
      value = '0.';
    }

    setEditableFare(value);
  };

  // Select all value when field is focused for easy replacement
  const handleFareFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const { day, time } = formatDateTime(validBooking.pickup_time);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-lg mx-auto p-0 bg-gray-900 text-white border-gray-700">
        {/* Header without close button - using default Dialog close button */}
        <div className="flex items-center gap-3 p-4 pt-8">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={validBooking.passenger_photo || validBooking.passenger_photo_url} 
              alt={passengerName}
            />
            <AvatarFallback className="bg-gray-700 text-white">
              {passengerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-white">{passengerName}</h3>
            <p className="text-sm text-gray-300">Requested Vehicle Type: {validBooking.vehicle_type}</p>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Pickup and Drop-off */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 border-b border-dotted border-gray-600 pb-1">
                  {validBooking.pickup_location}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mt-1"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 border-b border-dotted border-gray-600 pb-1">
                  {validBooking.dropoff_location}
                </p>
              </div>
            </div>
          </div>

          {/* Time to respond countdown */}
          <div className="bg-red-600 text-white p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Time to respond: {formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Date and Time + Open in Maps */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{day}, {time}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewRoute}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <Map className="h-4 w-4 mr-2" />
              Open in Maps
            </Button>
          </div>

          {/* Suggested fare */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Suggested fare</p>
              <p className="text-3xl font-bold text-white">${suggestedFare.toFixed(2)}</p>
            </div>

            {/* Editable Fare */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-white">Editable Fare</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-white" />
                  <Input
                    type="text"
                    value={editableFare}
                    onChange={handleFareChange}
                    onFocus={handleFareFocus}
                    className="w-20 bg-gray-700 border-gray-600 text-white text-center font-bold"
                  />
                  <span className="text-white text-sm">▼</span>
                </div>
              </div>
            </div>

            {/* Send Offer Button */}
            <Button
              onClick={handleSendOfferClick}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
              variant="outline"
            >
              Send Offer
            </Button>

            {/* Accept and Reject buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleAcceptClick}
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Accept Ride
              </Button>
              <Button
                onClick={handleRejectClick}
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Reject Ride
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4"></div>
      </DialogContent>
    </Dialog>
  );
};