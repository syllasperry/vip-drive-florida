import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, User, Car, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentConfirmed: () => void;
}

export const PaymentModal = ({ isOpen, onClose, booking, onPaymentConfirmed }: PaymentModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const { toast } = useToast();

  // Add null check to prevent crashes
  if (!booking) {
    return null;
  }

  const handlePaymentConfirmation = async () => {
    setIsConfirming(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'payment_confirmed',
          payment_confirmation_status: 'passenger_paid',
          passenger_payment_confirmed_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Payment Confirmed!",
        description: "We've notified your driver. They'll confirm receipt shortly.",
        variant: "default"
      });

      onPaymentConfirmed();
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-semibold text-center">Complete Your Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ride Summary */}
          <Card className="border-border/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary/10 rounded-full">
                  <Clock className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString() : ''} at {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {booking.pickup_location}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="h-px bg-border flex-1"></div>
                    <Car className="h-2 w-2 text-muted-foreground flex-shrink-0" />
                    <div className="h-px bg-border flex-1"></div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.dropoff_location}
                  </p>
                </div>
              </div>

              {booking.drivers && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-primary" />
                  <span className="text-xs text-foreground">
                    Driver: {booking.drivers.full_name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-primary-glow/5">
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">Trip Cost</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(booking.final_price || booking.estimated_price || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(booking.final_price || booking.estimated_price || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Driver Information */}
          <Card className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-3 w-3 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Driver</span>
              </div>
              <p className="text-sm text-foreground font-medium">
                {booking.drivers?.full_name || "Driver"}
              </p>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="border-border/50">
            <CardContent className="p-3">
              <button 
                onClick={() => setShowPaymentInstructions(true)}
                className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-primary" />
                  <span className="text-sm font-medium text-foreground">Payment Instructions</span>
                </div>
                <div className="text-xs text-primary">View Details →</div>
              </button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button 
              onClick={handlePaymentConfirmation}
              disabled={isConfirming}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg text-sm"
            >
              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Confirming...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  I've Made the Payment
                </div>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full h-10 rounded-lg text-sm"
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center px-2">
            After confirming, your driver will be notified and will confirm receipt of payment.
          </div>
        </div>
      </DialogContent>

      {/* Payment Instructions Modal */}
      <Dialog open={showPaymentInstructions} onOpenChange={setShowPaymentInstructions}>
        <DialogContent className="max-w-sm mx-auto p-4">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg font-semibold text-center">Payment Instructions</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Payment Method:</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {booking.drivers?.preferred_payment_method || 'Not defined'}
                  </p>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Instructions:</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {booking.drivers?.payment_instructions ? (
                      <p>{booking.drivers.payment_instructions}</p>
                    ) : booking.driver_payment_instructions ? (
                      <p>{booking.driver_payment_instructions}</p>
                    ) : (
                      <p>No payment instructions provided by driver yet.</p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
                  Once you've made the payment, please confirm using the "I've Made the Payment" button.
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => setShowPaymentInstructions(false)}
              variant="outline"
              className="w-full h-10 rounded-lg text-sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};