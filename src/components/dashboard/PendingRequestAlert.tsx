import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, MapPin, Car, Navigation, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PendingRequest {
  id: string;
  passenger: string;
  passengers?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    phone?: string;
    email?: string;
    preferred_temperature?: number;
    music_preference?: string;
    interaction_preference?: string;
    trip_purpose?: string;
    additional_notes?: string;
  };
  from: string;
  to: string;
  time: string;
  date: string;
  vehicle_type: string;
  passenger_count: number;
  luggage_count: number;
  flight_info?: string;
  passenger_phone?: string;
}

interface PendingRequestAlertProps {
  requests: PendingRequest[];
  onAccept: (requestId: string, price?: number) => void;
  onDecline: (requestId: string) => void;
  onClose?: (requestId: string) => void;
}

const PendingRequestAlert = ({ requests, onAccept, onDecline, onClose }: PendingRequestAlertProps) => {
  const [suggestedPrices, setSuggestedPrices] = useState<{ [key: string]: number }>({});
  const [isEditingPrice, setIsEditingPrice] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Initialize suggested prices for each request
  useEffect(() => {
    const prices: { [key: string]: number } = {};
    requests.forEach(request => {
      if (!suggestedPrices[request.id]) {
        prices[request.id] = 25; // Default suggested price as shown in reference
      }
    });
    setSuggestedPrices(prev => ({ ...prev, ...prices }));
  }, [requests]);

  const handlePriceChange = (requestId: string, newPrice: number) => {
    setSuggestedPrices(prev => ({ ...prev, [requestId]: newPrice }));
  };

  const handleSendOffer = async (requestId: string) => {
    try {
      const price = suggestedPrices[requestId];
      
      // Update booking with new price and correct status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          final_price: price,
          ride_status: 'offer_sent',
          payment_confirmation_status: 'price_awaiting_acceptance',
          driver_id: (await supabase.auth.getSession()).data.session?.user?.id,
          payment_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send automatic message to passenger about the price
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        await supabase
          .from('messages')
          .insert({
            booking_id: requestId,
            sender_id: sessionData.session.user.id,
            sender_type: 'driver',
            message_text: `I've proposed a price of $${price} for your ride. Please confirm to proceed with the booking.`
          });
      }

      toast({
        title: "Offer sent!",
        description: `Your $${price} offer has been sent to the passenger.`,
      });

      // Auto-close the alert after successful offer
      setTimeout(() => {
        onDecline(requestId);
      }, 1500);
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer to passenger.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRide = async (requestId: string) => {
    try {
      await onAccept(requestId, suggestedPrices[requestId]);
      toast({
        title: "Ride accepted!",
        description: "The passenger has been notified.",
      });
      
      // Auto-close the alert after successful accept
      setTimeout(() => {
        onDecline(requestId);
      }, 1500);
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept the ride.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRide = async (requestId: string) => {
    try {
      await supabase
        .from('bookings')
        .update({ 
          ride_status: 'rejected_by_driver',
          driver_id: null
        })
        .eq('id', requestId);

      toast({
        title: "Ride rejected",
        description: "The passenger has been notified.",
      });

      onDecline(requestId);
    } catch (error) {
      console.error('Error rejecting ride:', error);
      toast({
        title: "Error",
        description: "Failed to reject the ride.",
        variant: "destructive",
      });
    }
  };

  const openInMaps = (pickup: string, dropoff: string) => {
    const encodedPickup = encodeURIComponent(pickup);
    const encodedDropoff = encodeURIComponent(dropoff);
    
    // Try to detect platform and open appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${encodedDropoff}&saddr=${encodedPickup}`, '_blank');
    } else if (isAndroid) {
      window.open(`google.navigation:q=${encodedDropoff}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/${encodedPickup}/${encodedDropoff}`, '_blank');
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const timeStr = time;
    return `${dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })}, ${timeStr}`;
  };

  if (requests.length === 0) return null;

  return (
    <Dialog open={requests.length > 0} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto bg-gray-800 text-white border-none p-0 gap-0">
        {requests.map((request) => (
          <div key={request.id} className="relative">
            {/* Close Button */}
            <button
              onClick={() => onClose ? onClose(request.id) : onDecline(request.id)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-full transition-colors z-10"
            >
              <X className="h-5 w-5 text-gray-300" />
            </button>

            <div className="p-6">
              {/* Passenger Info */}
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage 
                    src={request.passengers?.profile_photo_url} 
                    alt={request.passenger}
                  />
                  <AvatarFallback className="bg-gray-600 text-white font-semibold text-lg">
                    {request.passenger.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">
                    {request.passenger}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Requested Vehicle Type: {request.vehicle_type}
                  </p>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-200">{request.from}</span>
              </div>

              {/* Dropoff Location */}
              <div className="flex items-center gap-3 mb-4">
                <Car className="h-5 w-5 text-gray-400" />
                <span className="text-gray-200">{request.to}</span>
              </div>

              {/* Date/Time and Maps Button */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-200">
                  {formatDateTime(request.date, request.time)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openInMaps(request.from, request.to)}
                  className="border-gray-600 text-gray-200 hover:bg-gray-700 bg-transparent"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
              </div>

              {/* Suggested Fare */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Suggested fare</p>
                <p className="text-3xl font-bold text-white mb-4">
                  ${suggestedPrices[request.id]?.toFixed(2) || "25.00"}
                </p>

                {/* Editable Fare */}
                <div className="relative mb-4">
                  <div className="flex items-center justify-between border border-gray-600 rounded-lg p-3 bg-gray-700">
                    <span className="text-gray-300">Editable Fare</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={suggestedPrices[request.id] || 25}
                        onChange={(e) => handlePriceChange(request.id, Number(e.target.value))}
                        className="w-20 text-right bg-transparent border-none text-white font-semibold p-0 focus:ring-0"
                        step="0.01"
                        min="0"
                      />
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Send Offer Button */}
                <Button
                  onClick={() => handleSendOffer(request.id)}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 mb-4 rounded-lg"
                >
                  Send Offer
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleAcceptRide(request.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
                >
                  Accept Ride
                </Button>
                <Button 
                  onClick={() => handleRejectRide(request.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold"
                >
                  Reject Ride
                </Button>
              </div>
            </div>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default PendingRequestAlert;