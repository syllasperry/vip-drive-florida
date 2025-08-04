import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, DollarSign, Send, Phone, Music, Thermometer, MessageSquare, Map, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PriceOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  driverProfile: any;
  onOfferSent: () => void;
}

export const PriceOfferModal = ({ isOpen, onClose, booking, driverProfile, onOfferSent }: PriceOfferModalProps) => {
  const [offerPrice, setOfferPrice] = useState(booking.estimated_fare || calculateEstimatedPrice());
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    await handleSendOffer();
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'rejected_by_driver',
          payment_confirmation_status: 'rejected'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Ride Rejected",
        description: "The ride request has been rejected.",
        variant: "default"
      });

      onClose();
    } catch (error) {
      console.error('Error rejecting ride:', error);
      toast({
        title: "Error",
        description: "Failed to reject ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendOffer = async () => {
    if (!offerPrice || offerPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price amount.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'offer_sent',
          payment_confirmation_status: 'price_awaiting_acceptance',
          final_price: offerPrice,
          driver_payment_instructions: getDefaultPaymentInstructions(),
          driver_id: driverProfile.id,
          payment_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Offer Sent!",
        description: "Your price offer has been sent to the passenger.",
        variant: "default"
      });

      onOfferSent();
      onClose();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getDefaultPaymentInstructions = () => {
    const instructions = [];
    if (driverProfile.venmo_info) instructions.push(`Venmo: @${driverProfile.venmo_info}`);
    if (driverProfile.zelle_info) instructions.push(`Zelle: ${driverProfile.zelle_info}`);
    if (driverProfile.apple_pay_info) instructions.push(`Apple Pay: ${driverProfile.apple_pay_info}`);
    instructions.push('Cash payment accepted at pickup');
    return instructions.join('\n');
  };

  function calculateEstimatedPrice() {
    // Simple estimation: base rate + distance
    const baseRate = 15;
    const perMileRate = 2;
    const distance = booking.distance_miles || 10;
    return Math.round(baseRate + (distance * perMileRate));
  }

  const handleViewRoute = () => {
    const pickup = encodeURIComponent(booking.pickup_location);
    const dropoff = encodeURIComponent(booking.dropoff_location);
    const mapsUrl = `https://maps.google.com/maps?saddr=${pickup}&daddr=${dropoff}`;
    window.open(mapsUrl, '_blank');
  };

  // Get passenger info - handle both direct fields and nested passenger object
  const passengerName = booking.passenger_name || booking.passengers?.full_name || 'Passenger';
  const passengerPhone = booking.passenger_phone || booking.passengers?.phone || '';
  const passengerPhoto = booking.profile_photo_url || booking.passengers?.profile_photo_url || '';
  const musicPref = booking.music_preference || booking.passengers?.music_preference || '';
  const tempPref = booking.preferred_temperature || booking.passengers?.preferred_temperature || '';
  const interactionPref = booking.interaction_preference || booking.passengers?.interaction_preference || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto p-0">
        <div className="bg-background rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">~ New Ride Request</h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Pending Driver Offer
            </Badge>
          </div>

          <div className="p-4 space-y-4">
            {/* Passenger Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={passengerPhoto} alt={passengerName} />
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {passengerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Passenger</p>
                  <p className="font-semibold text-lg">{passengerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{passengerPhone}</span>
              </div>
            </div>

            {/* Pickup Location */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{booking.pickup_location}</p>
                </div>
                {/* Preference Icons */}
                <div className="flex gap-2">
                  {musicPref === 'likes_music' && <Music className="h-4 w-4 text-blue-500" />}
                  {tempPref && <Thermometer className="h-4 w-4 text-orange-500" />}
                  {interactionPref === 'quiet_ride' && <MessageSquare className="h-4 w-4 text-gray-500" />}
                </div>
              </div>

              {/* Drop-off Location */}
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Drop-off</p>
                  <p className="font-medium">{booking.dropoff_location}</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Fare Section */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Fare</p>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <Input
                        type="number"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-lg font-bold"
                        onBlur={() => setIsEditing(false)}
                        autoFocus
                      />
                      <span className="text-lg font-bold">USD</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 hover:bg-gray-50 p-1 rounded"
                    >
                      <span className="text-2xl font-bold">${offerPrice} USD</span>
                      <span className="text-sm text-blue-600">(editable)</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString() + ', ' + new Date(booking.pickup_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">$11,000</p>
                <p className="text-xs text-muted-foreground">Based on Uber price estimate</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button 
                onClick={handleAccept}
                disabled={isSending}
                className="h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
              >
                {isSending ? "Sending..." : "Accept"}
              </Button>
              <Button 
                onClick={handleSendOffer}
                disabled={isSending}
                variant="outline"
                className="h-12 bg-gray-800 hover:bg-gray-900 text-white border-gray-800 font-medium rounded-xl"
              >
                Send Offer
              </Button>
            </div>

            {/* View Route & Reject */}
            <div className="flex items-center justify-between pt-2">
              <Button 
                variant="ghost" 
                onClick={handleViewRoute}
                className="flex items-center gap-2 text-sm"
              >
                <Map className="h-4 w-4" />
                View Route
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleReject}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};