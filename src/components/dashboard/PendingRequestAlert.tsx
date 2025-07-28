import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin, Car, Phone } from "lucide-react";

interface PendingRequest {
  id: string;
  passenger: string;
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
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

const PendingRequestAlert = ({ requests, onAccept, onDecline }: PendingRequestAlertProps) => {
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});

  // Initialize countdown timers for each request (5 minutes to respond)
  useEffect(() => {
    const timers: { [key: string]: number } = {};
    requests.forEach(request => {
      if (!timeLeft[request.id]) {
        timers[request.id] = 300; // 5 minutes = 300 seconds
      }
    });
    setTimeLeft(prev => ({ ...prev, ...timers }));
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

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (requests.length === 0) return null;

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card 
          key={request.id} 
          className="border-warning/50 bg-gradient-to-r from-warning/5 to-orange-500/5 animate-pulse shadow-lg"
        >
          <CardContent className="p-6">
            {/* Header with blinking alert */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-4 h-4 bg-warning rounded-full animate-ping absolute"></div>
                  <div className="w-4 h-4 bg-warning rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">🚨 NEW RIDE REQUEST</h3>
                  <p className="text-sm text-muted-foreground">Vehicle Match: {request.vehicle_type}</p>
                </div>
              </div>
              <div className="text-center">
                <Badge variant="destructive" className="mb-1 animate-pulse">
                  {formatTimeLeft(timeLeft[request.id] || 0)} left
                </Badge>
                <p className="text-xs text-muted-foreground">to respond</p>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{request.passenger}</span>
                <span className="text-muted-foreground">• {request.passenger_count} passenger(s)</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Pickup:</p>
                    <p className="text-sm text-muted-foreground">{request.from}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Dropoff:</p>
                    <p className="text-sm text-muted-foreground">{request.to}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{request.date} at {request.time}</span>
                </div>
                {request.luggage_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Car className="h-4 w-4 text-primary" />
                    <span>{request.luggage_count} luggage</span>
                  </div>
                )}
              </div>

              {request.flight_info && (
                <div className="p-2 bg-blue-50/50 rounded border border-blue-200">
                  <p className="text-sm"><span className="font-medium">Flight:</span> {request.flight_info}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                size="lg" 
                onClick={() => onAccept(request.id)}
                className="flex-1 bg-gradient-to-r from-success to-green-600 hover:from-success/90 hover:to-green-600/90"
              >
                ✅ Accept Ride
              </Button>
              <Button 
                size="lg" 
                variant="destructive"
                onClick={() => onDecline(request.id)}
                className="flex-1"
              >
                ❌ Decline
              </Button>
            </div>

            {/* Urgency indicator */}
            {timeLeft[request.id] && timeLeft[request.id] < 60 && (
              <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded">
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