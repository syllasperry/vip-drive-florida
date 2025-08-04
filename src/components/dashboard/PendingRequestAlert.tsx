import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Music, Thermometer, MessageCircle } from "lucide-react";
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
}

const PendingRequestAlert = ({ requests, onAccept, onDecline }: PendingRequestAlertProps) => {
  const [suggestedPrices, setSuggestedPrices] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  // Initialize suggested prices for each request
  useEffect(() => {
    const prices: { [key: string]: number } = {};
    requests.forEach(request => {
      if (!suggestedPrices[request.id]) {
        prices[request.id] = 119; // Default suggested price as shown in reference
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
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer to passenger.",
        variant: "destructive",
      });
    }
  };

  const handleClose = (requestId: string) => {
    onDecline(requestId);
  };

  if (requests.length === 0) return null;

  return (
    <>
      {requests.map((request) => (
        <div key={request.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full mx-auto relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={() => handleClose(request.id)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-10"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                New Ride Request
              </h2>
            </div>

            {/* Passenger Info */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={request.passengers?.profile_photo_url} 
                  alt={request.passenger}
                />
                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-lg">
                  {request.passenger.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {request.passenger}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Pickup: {request.from}</p>
                  <p>Drop-off: {request.to}</p>
                </div>
              </div>
            </div>

            {/* Passenger Preferences Icons */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {request.passengers?.music_preference && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                  <Music className="h-5 w-5 text-red-500" />
                </div>
              )}
              {request.passengers?.preferred_temperature && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <Thermometer className="h-5 w-5 text-blue-500" />
                </div>
              )}
              {request.passengers?.interaction_preference && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full">
                  <MessageCircle className="h-5 w-5 text-gray-500" />
                </div>
              )}
            </div>

            {/* Editable Fare */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Editable Fare
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={suggestedPrices[request.id] || 119}
                    onChange={(e) => handlePriceChange(request.id, Number(e.target.value))}
                    className="text-lg font-semibold text-center border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                    placeholder="$119 USD"
                  />
                </div>
                <Button
                  onClick={() => handleSendOffer(request.id)}
                  className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Send Offer
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => onAccept(request.id, suggestedPrices[request.id])}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold text-lg"
              >
                Accept
              </Button>
              <Button 
                onClick={() => onDecline(request.id)}
                variant="outline"
                className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-3 rounded-lg font-semibold text-lg"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default PendingRequestAlert;