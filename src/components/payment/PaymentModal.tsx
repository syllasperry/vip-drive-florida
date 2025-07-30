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
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-3 w-3 text-primary" />
                <span className="text-sm font-medium text-foreground">Payment Instructions</span>
              </div>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                {booking.driver_payment_instructions ? (
                  <p className="bg-muted/50 p-2 rounded-lg text-foreground text-xs">
                    {booking.driver_payment_instructions}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {booking.drivers?.venmo_info && (
                      <p>• <strong>Venmo:</strong> @{booking.drivers.venmo_info}</p>
                    )}
                    {booking.drivers?.zelle_info && (
                      <p>• <strong>Zelle:</strong> {booking.drivers.zelle_info}</p>
                    )}
                    {booking.drivers?.apple_pay_info && (
                      <p>• <strong>Apple Pay:</strong> {booking.drivers.apple_pay_info}</p>
                    )}
                    {booking.drivers?.google_pay_info && (
                      <p>• <strong>Google Pay:</strong> {booking.drivers.google_pay_info}</p>
                    )}
                    {booking.drivers?.payment_link_info && (
                      <p>• <strong>Payment Link:</strong> {booking.drivers.payment_link_info}</p>
                    )}
                    {!booking.drivers?.venmo_info && !booking.drivers?.zelle_info && (
                      <p>• Cash payment accepted at pickup</p>
                    )}
                  </div>
                )}
              </div>
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
    </Dialog>
  );
};