import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, CreditCard, FileText, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverPaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  currentData?: {
    payment_methods_accepted?: string[];
    cancellation_policy?: string;
    preferred_payment_method?: string;
    payment_instructions?: string;
  };
  onUpdate: () => void;
}

export const DriverPaymentSettingsModal = ({ 
  isOpen, 
  onClose, 
  driverId,
  currentData,
  onUpdate
}: DriverPaymentSettingsModalProps) => {
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentData) {
      setPaymentMethods(currentData.payment_methods_accepted || []);
      setCancellationPolicy(currentData.cancellation_policy || "");
      setPreferredPaymentMethod(currentData.preferred_payment_method || "");
      setPaymentInstructions(currentData.payment_instructions || "");
    }
  }, [currentData]);

  const addPaymentMethod = () => {
    if (newPaymentMethod.trim() && !paymentMethods.includes(newPaymentMethod.trim())) {
      setPaymentMethods([...paymentMethods, newPaymentMethod.trim()]);
      setNewPaymentMethod("");
    }
  };

  const removePaymentMethod = (method: string) => {
    setPaymentMethods(paymentMethods.filter(m => m !== method));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          payment_methods_accepted: paymentMethods,
          cancellation_policy: cancellationPolicy || null,
          preferred_payment_method: preferredPaymentMethod || null,
          payment_instructions: paymentInstructions || null
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Your payment settings have been saved successfully.",
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to update payment settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preferred Payment Method */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Preferred Payment Method
            </Label>
            <Select value={preferredPaymentMethod} onValueChange={setPreferredPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select your preferred payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zelle">Zelle</SelectItem>
                <SelectItem value="payment_link">Payment Link</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Instructions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Payment Instructions
            </Label>
            <Textarea
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder={
                preferredPaymentMethod === "zelle" 
                  ? "Enter your Zelle email and/or phone number\nExample: myemail@example.com or (555) 123-4567"
                  : preferredPaymentMethod === "payment_link"
                  ? "Enter your payment link\nExample: https://paypal.me/yourname"
                  : preferredPaymentMethod === "cash"
                  ? "Specify cash payment details\nExample: Exact change preferred"
                  : "Enter specific payment instructions"
              }
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Provide clear instructions for passengers on how to send payment using your preferred method.
            </p>
          </div>

          {/* Additional Payment Methods */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Additional Payment Methods (Optional)
            </Label>
            
            <div className="flex gap-2">
              <Input
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                placeholder="e.g., Zelle, Apple Pay, Pix"
                onKeyPress={(e) => e.key === 'Enter' && addPaymentMethod()}
              />
              <Button 
                type="button" 
                onClick={addPaymentMethod}
                size="sm"
                disabled={!newPaymentMethod.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {paymentMethods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {method}
                    <button
                      onClick={() => removePaymentMethod(method)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Add any additional payment methods you accept beyond your preferred method.
            </p>
          </div>

          {/* Cancellation Policy */}
          <div className="space-y-3">
            <Label htmlFor="cancellation-policy" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cancellation Policy
            </Label>
            <Textarea
              id="cancellation-policy"
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              placeholder="Describe your cancellation and refund policy..."
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Explain your policy for cancellations, refunds, and any fees. This will be visible to passengers.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={isLoading || !preferredPaymentMethod || !paymentInstructions.trim()}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};