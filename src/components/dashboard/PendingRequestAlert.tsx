import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, MapPin, Luggage, Edit3, Send } from "lucide-react";
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
  };
  from: string;
  to: string;
  time: string;
  date: string;
  vehicle_type: string;
  passenger_count: number;
  luggage_count: number;
  flight_info?: string;
}

interface PendingRequestAlertProps {
  requests: PendingRequest[];
  onAccept: (requestId: string, price?: number) => void;
  onDecline: (requestId: string) => void;
}

const PendingRequestAlert = ({ requests, onAccept, onDecline }: PendingRequestAlertProps) => {
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});
  const [suggestedPrices, setSuggestedPrices] = useState<{ [key: string]: number }>({});
  const [editingPrice, setEditingPrice] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Initialize countdown timers and suggested prices for each request
  useEffect(() => {
    const timers: { [key: string]: number } = {};
    const prices: { [key: string]: number } = {};
    requests.forEach(request => {
      if (!timeLeft[request.id]) {
        timers[request.id] = 270; // 4:30 minutes = 270 seconds (matching the image)
      }
      if (!suggestedPrices[request.id]) {
        // Calculate suggested price based on estimated distance/time
        prices[request.id] = calculateSuggestedPrice(request);
      }
    });
    setTimeLeft(prev => ({ ...prev, ...timers }));
    setSuggestedPrices(prev => ({ ...prev, ...prices }));
  }, [requests]);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(requestId => {
          if (updated[requestId] > 0) {
            updated[requestId] -= 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const calculateSuggestedPrice = (request: PendingRequest): number => {
    // Basic price calculation - can be enhanced with actual distance API
    return 100; // Default suggested price
  };

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePriceEdit = (requestId: string) => {
    setEditingPrice(prev => ({ ...prev, [requestId]: true }));
  };

  const handlePriceChange = (requestId: string, newPrice: number) => {
    setSuggestedPrices(prev => ({ ...prev, [requestId]: newPrice }));
  };

  const handleSendPriceToPassenger = async (requestId: string) => {
    try {
      const price = suggestedPrices[requestId];
      
      // Update booking with new price and correct status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          final_price: price,
          status: 'price_proposed' 
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
        title: "Price sent to passenger",
        description: `$${price} has been sent to the passenger for confirmation.`,
      });

      setEditingPrice(prev => ({ ...prev, [requestId]: false }));
    } catch (error) {
      console.error('Error sending price to passenger:', error);
      toast({
        title: "Error",
        description: "Failed to send price to passenger.",
        variant: "destructive",
      });
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card 
          key={request.id} 
          className="border-2 border-primary/20 bg-card shadow-lg hover:shadow-xl transition-shadow"
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                <h2 className="text-lg font-bold text-foreground">NEW RIDE REQUEST</h2>
              </div>
              <Badge variant="destructive" className="px-3 py-1 text-sm font-semibold">
                {formatTimeLeft(timeLeft[request.id] || 0)} left
              </Badge>
            </div>

            {/* Vehicle Match */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Vehicle Match: <span className="font-medium text-foreground">{request.vehicle_type}</span>
              </p>
            </div>

            {/* Passenger Info */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={request.passengers?.profile_photo_url} 
                  alt={request.passenger}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {request.passenger.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{request.passenger}</p>
                <p className="text-sm text-muted-foreground">
                  {request.passenger_count} passenger{request.passenger_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Pickup:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{request.from}</p>
                </div>
              </div>
              <div className="border-l-2 border-dotted border-muted ml-1.5 h-4"></div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-destructive rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Dropoff:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{request.to}</p>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">{request.date}</span>
                <span className="text-muted-foreground">at {request.time}</span>
              </div>
              {request.luggage_count > 0 && (
                <div className="flex items-center gap-2">
                  <Luggage className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{request.luggage_count} luggage</span>
                </div>
              )}
            </div>

            {/* Flight Info */}
            {request.flight_info && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Flight:</span> {request.flight_info}
                </p>
              </div>
            )}

            {/* Price Section */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Suggested Price:</p>
                {!editingPrice[request.id] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePriceEdit(request.id)}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {editingPrice[request.id] ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={suggestedPrices[request.id] || ''}
                      onChange={(e) => handlePriceChange(request.id, Number(e.target.value))}
                      className="text-lg font-bold"
                      placeholder="Enter price"
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSendPriceToPassenger(request.id)}
                    className="px-3"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Send to Passenger
                  </Button>
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary">
                  ${suggestedPrices[request.id] || 100}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                size="lg" 
                onClick={() => onAccept(request.id, suggestedPrices[request.id])}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                ✅ Accept Ride
              </Button>
              <Button 
                size="lg" 
                variant="destructive"
                onClick={() => onDecline(request.id)}
                className="flex-1 font-semibold"
              >
                ❌ Decline
              </Button>
            </div>

            {/* Urgency indicator */}
            {timeLeft[request.id] && timeLeft[request.id] < 60 && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive font-medium text-center">
                  ⚠️ URGENT: Less than 1 minute left to respond!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PendingRequestAlert;