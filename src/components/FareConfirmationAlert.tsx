import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Clock } from "lucide-react";

interface FareConfirmationAlertProps {
  isVisible: boolean;
  fareAmount: number;
  onAccept: () => void;
  onDecline: () => void;
  onClose?: () => void;
  expiresAt: Date;
}

export const FareConfirmationAlert = ({ 
  isVisible, 
  fareAmount, 
  onAccept, 
  onDecline, 
  onClose,
  expiresAt 
}: FareConfirmationAlertProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!isVisible) return;

    const updateTimer = () => {
      const now = new Date();
      const timeDiff = expiresAt.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isVisible, expiresAt]);

  if (!isVisible) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 animate-pulse relative max-w-full mx-auto">
      <CardContent className="p-4">
        {/* Close button for expired state */}
        {timeLeft === "Expired" && onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                🔔 Your driver has accepted your request and proposed a fare. Do you confirm?
              </h3>
              <p className="text-lg font-bold text-primary mt-1">
                ${fareAmount.toFixed(2)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                ⏳ Time left to respond: <Badge variant="secondary" className="text-xs">{timeLeft}</Badge>
              </span>
            </div>
            
            {/* Mobile-optimized button layout */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button 
                onClick={onAccept}
                className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-sm"
                disabled={timeLeft === "Expired"}
              >
                <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">✅ Accept Price</span>
              </Button>
              <Button 
                onClick={onDecline}
                variant="outline"
                className="w-full sm:flex-1 border-destructive text-destructive hover:bg-destructive/10 text-sm"
                disabled={timeLeft === "Expired"}
              >
                <X className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">❌ Decline Ride</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};