import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Smartphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverPaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  currentData?: any;
  onUpdate?: () => void;
}

export const DriverPaymentMethodsModal = ({ 
  isOpen, 
  onClose, 
  driverId, 
  currentData,
  onUpdate 
}: DriverPaymentMethodsModalProps) => {
  const [creditCards, setCreditCards] = useState<string[]>([]);
  const [digitalPayments, setDigitalPayments] = useState<string[]>([]);
  const [preferredMethod, setPreferredMethod] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [zelleLinfo, setZelleInfo] = useState("");
  const [venmoInfo, setVenmoInfo] = useState("");
  const [applePayInfo, setApplePayInfo] = useState("");
  const [googlePayInfo, setGooglePayInfo] = useState("");
  const [paymentLinkInfo, setPaymentLinkInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentData && isOpen) {
      setCreditCards(currentData.payment_methods_credit_cards || []);
      setDigitalPayments(currentData.payment_methods_digital || []);
      setPreferredMethod(currentData.preferred_payment_method || "");
      setPaymentInstructions(currentData.payment_instructions || "");
      setZelleInfo(currentData.zelle_info || "");
      setVenmoInfo(currentData.venmo_info || "");
      setApplePayInfo(currentData.apple_pay_info || "");
      setGooglePayInfo(currentData.google_pay_info || "");
      setPaymentLinkInfo(currentData.payment_link_info || "");
    }
  }, [currentData, isOpen]);

  const creditCardOptions = ["VISA", "Mastercard", "American Express", "Discover"];
  const digitalPaymentOptions = ["Apple Pay", "Google Pay", "Venmo", "Zelle", "Payment Link"];

  const handleCreditCardChange = (option: string, checked: boolean) => {
    if (checked) {
      setCreditCards(prev => [...prev, option]);
    } else {
      setCreditCards(prev => prev.filter(card => card !== option));
    }
  };

  const handleDigitalPaymentChange = (option: string, checked: boolean) => {
    if (checked) {
      setDigitalPayments(prev => [...prev, option]);
    } else {
      setDigitalPayments(prev => prev.filter(payment => payment !== option));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          payment_methods_credit_cards: creditCards,
          payment_methods_digital: digitalPayments,
          preferred_payment_method: preferredMethod,
          payment_instructions: paymentInstructions,
          zelle_info: zelleLinfo,
          venmo_info: venmoInfo,
          apple_pay_info: applePayInfo,
          google_pay_info: googlePayInfo,
          payment_link_info: paymentLinkInfo,
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Payment Methods Updated",
        description: "Your payment methods and instructions have been saved.",
      });

      onUpdate?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment methods",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Methods & Instructions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Credit Cards */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4" />
              Credit Cards
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {creditCardOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`credit-${option}`}
                    checked={creditCards.includes(option)}
                    onCheckedChange={(checked) => 
                      handleCreditCardChange(option, checked as boolean)
                    }
                  />
                  <Label htmlFor={`credit-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Payments */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4" />
              Digital Payments
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {digitalPaymentOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`digital-${option}`}
                    checked={digitalPayments.includes(option)}
                    onCheckedChange={(checked) => 
                      handleDigitalPaymentChange(option, checked as boolean)
                    }
                  />
                  <Label htmlFor={`digital-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Payment Method */}
          <div>
            <Label htmlFor="preferred-method" className="text-sm font-medium">
              Preferred Payment Method
            </Label>
            <Input
              id="preferred-method"
              value={preferredMethod}
              onChange={(e) => setPreferredMethod(e.target.value)}
              placeholder="e.g., Zelle, Venmo, Cash"
              className="mt-1"
            />
          </div>

          {/* Payment Instructions */}
          <div>
            <Label htmlFor="payment-instructions" className="text-sm font-medium">
              Payment Instructions
            </Label>
            <Textarea
              id="payment-instructions"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="General instructions for passengers..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Specific Payment Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm">Specific Payment Details</h4>
            
            {digitalPayments.includes("Zelle") && (
              <div>
                <Label htmlFor="zelle-info" className="text-sm">
                  Zelle (Email/Phone)
                </Label>
                <Input
                  id="zelle-info"
                  value={zelleLinfo}
                  onChange={(e) => setZelleInfo(e.target.value)}
                  placeholder="your-email@example.com or phone number"
                  className="mt-1"
                />
              </div>
            )}

            {digitalPayments.includes("Venmo") && (
              <div>
                <Label htmlFor="venmo-info" className="text-sm">
                  Venmo Username
                </Label>
                <Input
                  id="venmo-info"
                  value={venmoInfo}
                  onChange={(e) => setVenmoInfo(e.target.value)}
                  placeholder="@your-venmo-username"
                  className="mt-1"
                />
              </div>
            )}

            {digitalPayments.includes("Apple Pay") && (
              <div>
                <Label htmlFor="apple-pay-info" className="text-sm">
                  Apple Pay (Phone Number)
                </Label>
                <Input
                  id="apple-pay-info"
                  value={applePayInfo}
                  onChange={(e) => setApplePayInfo(e.target.value)}
                  placeholder="Phone number for Apple Pay"
                  className="mt-1"
                />
              </div>
            )}

            {digitalPayments.includes("Google Pay") && (
              <div>
                <Label htmlFor="google-pay-info" className="text-sm">
                  Google Pay (Phone/Email)
                </Label>
                <Input
                  id="google-pay-info"
                  value={googlePayInfo}
                  onChange={(e) => setGooglePayInfo(e.target.value)}
                  placeholder="Phone number or email for Google Pay"
                  className="mt-1"
                />
              </div>
            )}

            {digitalPayments.includes("Payment Link") && (
              <div>
                <Label htmlFor="payment-link-info" className="text-sm">
                  Payment Link (Stripe, Square, etc.)
                </Label>
                <Input
                  id="payment-link-info"
                  value={paymentLinkInfo}
                  onChange={(e) => setPaymentLinkInfo(e.target.value)}
                  placeholder="https://your-payment-link.com"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};