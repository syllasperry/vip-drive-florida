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

  // Calculate realistic fare using Uber Black estimate logic
  const calculateUberBlackEstimate = (pickup: string, dropoff: string, vehicleType: string) => {
    // Base rate for Uber Black
    const baseRate = 25;
    const perMileRate = 4.5; // Higher rate for premium vehicles
    
    // Estimate distance (simplified - in real app would use Google Maps API)
    const estimatedDistance = 10; // Default 10 miles
    const timeMultiplier = 1.2; // Peak time adjustment
    
    const estimate = (baseRate + (estimatedDistance * perMileRate)) * timeMultiplier;
    return Math.max(estimate, 100); // Minimum $100 for premium service
  };

  // Initialize suggested prices for each request
  useEffect(() => {
    const prices: { [key: string]: number } = {};
    requests.forEach(request => {
      if (!suggestedPrices[request.id]) {
        const estimate = calculateUberBlackEstimate(request.from, request.to, request.vehicle_type);
        prices[request.id] = Math.round(estimate);
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
        title: "Price offer sent to passenger successfully",
        description: `Fare proposal of $${price.toFixed(2)} has been sent. Awaiting passenger response.`,
      });

      // Don't auto-close the modal - keep it available for driver
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
      const price = suggestedPrices[requestId];
      
      // Update booking to driver accepted status
      const { data: sessionData } = await supabase.auth.getSession();
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'driver_accepted',
          payment_confirmation_status: 'driver_accepted',
          final_price: price,
          driver_id: sessionData?.session?.user?.id,
          payment_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send notification message to passenger
      if (sessionData?.session?.user?.id) {
        await supabase
          .from('messages')
          .insert({
            booking_id: requestId,
            sender_id: sessionData.session.user.id,
            sender_type: 'driver',
            message_text: `Driver accepted your request. Final fare: $${price.toFixed(2)}. Payment instructions will be provided.`
          });
      }

      toast({
        title: "Ride accepted and passenger notified",
        description: `Fare confirmed at $${price.toFixed(2)}. Passenger has been notified.`,
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
    // Parse the date string and time string properly without timezone conversion
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${weekdays[dateObj.getDay()]}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${time}`;
  };

  if (requests.length === 0) return null;

  const handleCloseDialog = () => {
    if (requests.length > 0) {
      const firstRequestId = requests[0].id;
      onClose ? onClose(firstRequestId) : onDecline(firstRequestId);
    }
  };

  return (
    <Dialog open={requests.length > 0} onOpenChange={(open) => {
      if (!open) {
        handleCloseDialog();
      }
    }}>
      <DialogContent className="max-w-md mx-auto bg-gray-800 text-white border-none p-0 gap-0 [&>button]:hidden"
                     onEscapeKeyDown={handleCloseDialog}
                     onPointerDownOutside={handleCloseDialog}>
        {requests.map((request) => (
          <div key={request.id} className="relative">
            {/* Close Button - Single, larger, more visible */}
            <button
              onClick={handleCloseDialog}
              className="absolute top-3 right-3 p-3 hover:bg-gray-700/80 rounded-full transition-colors z-10 bg-gray-700/50"
            >
              <X className="h-6 w-6 text-white" />
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
                      <span className="text-white font-semibold">$</span>
                      <Input
                        type="text"
                        value={isEditingPrice[request.id] ? suggestedPrices[request.id]?.toString() || "" : (suggestedPrices[request.id]?.toFixed(2) || "100.00")}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          const numValue = parseFloat(value) || 0;
                          handlePriceChange(request.id, numValue);
                        }}
                        onFocus={() => {
                          setIsEditingPrice(prev => ({ ...prev, [request.id]: true }));
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value) || 100;
                          handlePriceChange(request.id, value);
                          setIsEditingPrice(prev => ({ ...prev, [request.id]: false }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' || e.key === 'Backspace') {
                            if (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === e.currentTarget.value.length) {
                              e.preventDefault();
                              handlePriceChange(request.id, 0);
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                        className="w-20 text-right bg-transparent border-none text-white font-semibold p-0 focus:ring-0"
                        placeholder="100.00"
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