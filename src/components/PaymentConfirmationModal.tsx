import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, DollarSign, Clock, AlertCircle, Smartphone } from "lucide-react";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    final_price: number;
    drivers?: {
      full_name: string;
      payment_methods_accepted?: string[];
      payment_methods_credit_cards?: string[];
      payment_methods_digital?: string[];
      cancellation_policy?: string;
      preferred_payment_method?: string;
      payment_instructions?: string;
      zelle_info?: string;
      venmo_info?: string;
      apple_pay_info?: string;
      google_pay_info?: string;
      payment_link_info?: string;
    };
    driver?: {
      full_name: string;
      payment_methods_accepted?: string[];
      payment_methods_credit_cards?: string[];
      payment_methods_digital?: string[];
      cancellation_policy?: string;
      preferred_payment_method?: string;
      payment_instructions?: string;
      zelle_info?: string;
      venmo_info?: string;
      apple_pay_info?: string;
      google_pay_info?: string;
      payment_link_info?: string;
    };
  };
  userType: 'passenger' | 'driver';
  onConfirmPayment: () => void;
  paymentStatus: string;
}

export const PaymentConfirmationModal = ({ 
  isOpen, 
  onClose, 
  bookingData, 
  userType,
  onConfirmPayment,
  paymentStatus
}: PaymentConfirmationModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirmPayment();
    setIsConfirming(false);
  };

  const isPassenger = userType === 'passenger';
  const isDriver = userType === 'driver';
  const hasDriverConfirmed = paymentStatus === 'driver_confirmed' || paymentStatus === 'both_confirmed';
  const hasPassengerConfirmed = paymentStatus === 'passenger_confirmed' || paymentStatus === 'both_confirmed';
  const bothConfirmed = paymentStatus === 'both_confirmed';
  
  // Handle both driver and drivers property names for backward compatibility
  const driverData = bookingData.drivers || bookingData.driver;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Confirmation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Price Display */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total Amount:</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    {bookingData.final_price}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          {isPassenger && driverData && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4" />
                  💳 Payment Information
                </h4>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Payment is made directly to the driver. We accept:
                </p>

                {/* Credit Cards */}
                {driverData.payment_methods_credit_cards && driverData.payment_methods_credit_cards.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Credit Cards
                    </h5>
                    <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                      {driverData.payment_methods_credit_cards.map((card, index) => (
                        <div key={index}>• {card}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Digital Payments */}
                {driverData.payment_methods_digital && driverData.payment_methods_digital.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      Digital Payments
                    </h5>
                    <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                      {driverData.payment_methods_digital.map((payment, index) => (
                        <div key={index}>• {payment}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Payment Method */}
                {driverData.preferred_payment_method && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="font-medium text-primary mb-2">
                      Preferred: {driverData.preferred_payment_method}
                    </div>
                    {driverData.payment_instructions && (
                      <div className="text-sm whitespace-pre-line">
                        {driverData.payment_instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* Specific Payment Details */}
                <div className="space-y-2 border-t pt-3">
                  {driverData.zelle_info && (
                    <div className="text-sm">
                      <span className="font-medium">Zelle:</span> {driverData.zelle_info}
                    </div>
                  )}
                  {driverData.venmo_info && (
                    <div className="text-sm">
                      <span className="font-medium">Venmo:</span> {driverData.venmo_info}
                    </div>
                  )}
                  {driverData.apple_pay_info && (
                    <div className="text-sm">
                      <span className="font-medium">Apple Pay:</span> {driverData.apple_pay_info}
                    </div>
                  )}
                  {driverData.google_pay_info && (
                    <div className="text-sm">
                      <span className="font-medium">Google Pay:</span> {driverData.google_pay_info}
                    </div>
                  )}
                  {driverData.payment_link_info && (
                    <div className="text-sm">
                      <span className="font-medium">Payment Link:</span>{" "}
                      <a 
                        href={driverData.payment_link_info} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Click here to pay
                      </a>
                    </div>
                  )}
                </div>

                {/* Cancellation Policy */}
                {driverData.cancellation_policy && (
                  <div className="pt-2 border-t">
                    <h5 className="font-medium text-sm mb-1">Cancellation Policy:</h5>
                    <p className="text-sm text-muted-foreground">
                      {driverData.cancellation_policy}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasPassengerConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-500" />
              )}
              <span className={hasPassengerConfirmed ? "text-green-600" : "text-yellow-600"}>
                Passenger Payment Confirmation
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {hasDriverConfirmed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-500" />
              )}
              <span className={hasDriverConfirmed ? "text-green-600" : "text-yellow-600"}>
                Driver Payment Confirmation
              </span>
            </div>
          </div>

          {/* Instructions */}
          {isPassenger && !hasPassengerConfirmed && (
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                      Payment Instructions
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Please send the payment directly to {driverData?.full_name || 'your driver'} using one of the accepted methods above. Once completed, confirm your payment below.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isDriver && !hasDriverConfirmed && (
            <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Confirm Payment Receipt
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Once you receive the payment from the passenger, please confirm below.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {bothConfirmed && (
            <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">
                      Payment Confirmed!
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Both parties have confirmed the payment. Ready to go!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            
            {!bothConfirmed && (
              <Button 
                onClick={handleConfirm} 
                className="flex-1"
                disabled={isConfirming || (isPassenger && hasPassengerConfirmed) || (isDriver && hasDriverConfirmed)}
              >
                {isConfirming ? "Confirming..." : 
                 isPassenger ? "I've Completed Payment" : "I've Received Payment"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};