import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, CreditCard, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverPaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  currentData?: {
    payment_methods_accepted?: string[];
    cancellation_policy?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentData) {
      setPaymentMethods(currentData.payment_methods_accepted || []);
      setCancellationPolicy(currentData.cancellation_policy || "");
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
          cancellation_policy: cancellationPolicy || null
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
          {/* Payment Methods */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Accepted Payment Methods
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
              Add the payment methods you accept. Passengers will see these options before booking.
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
              disabled={isLoading || paymentMethods.length === 0}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};