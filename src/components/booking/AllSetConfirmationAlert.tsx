import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AllSetConfirmationAlertProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export const AllSetConfirmationAlert = ({ 
  isOpen, 
  onClose,
  booking 
}: AllSetConfirmationAlertProps) => {
  if (!booking) return null;

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return "[Date] at [Time]";
    const date = new Date(dateTime);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-sm mx-auto bg-background border shadow-lg p-6">
        <DialogHeader className="text-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <DialogTitle className="text-2xl font-bold text-foreground">
            All Set!
          </DialogTitle>
          
          {/* Stars */}
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-2xl">⭐</span>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Your trip is confirmed. Everything is set — just wait for your ride day and enjoy the trip!
            </p>
          </div>

          {/* Trip Details */}
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-foreground">Date/Time: </span>
              <span className="text-muted-foreground">
                {formatDateTime(booking.pickup_time)}
              </span>
            </div>
            
            <div>
              <span className="font-semibold text-foreground">Pickup: </span>
              <span className="text-muted-foreground">
                {booking.pickup_location || "[Pickup Location]"}
              </span>
            </div>
            
            <div>
              <span className="font-semibold text-foreground">Drop-off: </span>
              <span className="text-muted-foreground">
                {booking.dropoff_location || "[Drop-off Location]"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};