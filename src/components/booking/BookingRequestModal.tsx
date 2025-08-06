import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Phone, Music, Thermometer, MessageSquare, DollarSign, X, Map } from "lucide-react";
import { format } from "date-fns";

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
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos em segundos
  const [suggestedFare, setSuggestedFare] = useState(booking?.estimated_price || 100);
  const [editableFare, setEditableFare] = useState((booking?.estimated_price || 100).toString());

  if (!booking) return null;

  const passengerName = booking.passenger_name || 
    (booking.passenger_first_name && booking.passenger_last_name 
      ? `${booking.passenger_first_name} ${booking.passenger_last_name}`
      : "Passenger");

  // Reset countdown when modal opens with new booking
  useEffect(() => {
    if (isOpen && booking) {
      setTimeLeft(600); // Reset to 10 minutes
    }
  }, [isOpen, booking?.id]);

  // Countdown effect
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-reject when time runs out
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, onReject]);

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
    const pickup = encodeURIComponent(booking.pickup_location);
    const dropoff = encodeURIComponent(booking.dropoff_location);
    const mapsUrl = `https://maps.google.com/maps?saddr=${pickup}&daddr=${dropoff}`;
    window.open(mapsUrl, '_blank');
  };

  // Função para atualizar o valor removendo prefixo zero
  const handleFareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove qualquer caractere que não seja número ou ponto decimal
    value = value.replace(/[^0-9.]/g, '');

    // Remove zeros à esquerda, exceto se for "0." para valores decimais
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.replace(/^0+/, '');
    }

    setEditableFare(value);
  };

  // Função para selecionar todo o valor quando o campo é focado
  const handleFareFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const { day, time } = formatDateTime(booking.pickup_time);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-lg mx-auto p-0 bg-gray-900 text-white border-gray-700">
        {/* Header without close button - using default Dialog close button */}
        <div className="flex items-center gap-3 p-4 pt-8">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={booking.passenger_photo || booking.passenger_photo_url} 
              alt={passengerName}
            />
            <AvatarFallback className="bg-gray-700 text-white">
              {passengerName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-white">{passengerName}</h3>
            <p className="text-sm text-gray-300">Requested Vehicle Type: {booking.vehicle_type}</p>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Pickup and Drop-off */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 border-b border-dotted border-gray-600 pb-1">
                  {booking.pickup_location}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mt-1"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 border-b border-dotted border-gray-600 pb-1">
                  {booking.dropoff_location}
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
              onClick={onSendOffer}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
              variant="outline"
            >
              Send Offer
            </Button>

            {/* Accept and Reject buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Accept Ride
              </Button>
              <Button
                onClick={onReject}
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