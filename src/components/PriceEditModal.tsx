import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface PriceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  onPriceUpdate: (newPrice: number) => void;
}

export const PriceEditModal = ({ isOpen, onClose, currentPrice, onPriceUpdate }: PriceEditModalProps) => {
  const [newPrice, setNewPrice] = useState(currentPrice);

  const handleSubmit = () => {
    if (newPrice > 0) {
      onPriceUpdate(newPrice);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Customize Ride Price
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm">
            Adjust the price based on additional services, extra stops, or special circumstances.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="price">New Price ($)</Label>
            <Input
              id="price"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
              placeholder="Enter new price"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={newPrice <= 0}>
              Update Price
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};