import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, AlertTriangle } from "lucide-react";

interface CancelBookingButtonProps {
  bookingId: string;
  pickupTime: string;
  onCancelSuccess?: () => void;
}

export const CancelBookingButton = ({ bookingId, pickupTime, onCancelSuccess }: CancelBookingButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if cancellation is allowed (1 hour before pickup)
  const canCancel = () => {
    const pickup = new Date(pickupTime);
    const now = new Date();
    const hoursUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilPickup >= 1;
  };

  const handleCancel = async () => {
    if (!canCancel()) {
      toast({
        title: "Cannot Cancel",
        description: "According to our cancellation policy, rides can only be cancelled at least 1 hour before the scheduled pickup time. This ride is no longer eligible for cancellation or refund.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Update booking status to cancelled_by_passenger
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled_by_passenger' })
        .eq('id', bookingId)
        .in('status', ['pending', 'accepted', 'all_set']); // Allow cancellation for these statuses

      if (updateError) {
        console.error('Error cancelling booking:', updateError);
        toast({
          title: "Error",
          description: `Failed to cancel booking: ${updateError.message}`,
          variant: "destructive",
        });
        return;
      }

      // Send email notifications
      try {
        await supabase.functions.invoke('send-booking-notifications', {
          body: {
            bookingId: bookingId,
            status: 'canceled',
            triggerType: 'status_change'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled. You and your driver have been notified.",
      });

      if (onCancelSuccess) {
        onCancelSuccess();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canCancel()) {
    return (
      <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3" />
          <span>Cannot cancel (less than 1h before pickup)</span>
        </div>
      </div>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          disabled={loading}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel Request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this booking? This action cannot be undone. 
            Both you and your driver will be notified about the cancellation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Cancelling..." : "Yes, Cancel"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};