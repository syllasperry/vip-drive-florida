import { useState } from "react";
import { X, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ShareRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

export const ShareRecommendationsModal = ({
  isOpen,
  onClose,
  onSendMessage
}: ShareRecommendationsModalProps) => {
  const [placeName, setPlaceName] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const commonPlaceTypes = [
    "Restaurant", "Cafe", "Bar", "Hotel", "Shopping", 
    "Tourist Attraction", "Entertainment", "Hospital", "Gas Station"
  ];

  const handleSend = () => {
    if (!placeName.trim()) return;

    let recommendation = `📍 **${placeName}**`;
    
    if (placeType) {
      recommendation += ` (${placeType})`;
    }
    
    if (address) {
      recommendation += `\n📧 Address: ${address}`;
    }
    
    if (description) {
      recommendation += `\n💭 ${description}`;
    }

    onSendMessage(recommendation);
    handleClose();
  };

  const handleClose = () => {
    setPlaceName("");
    setPlaceType("");
    setDescription("");
    setAddress("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-foreground">Share Recommendation</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="placeName">Place Name *</Label>
              <Input
                id="placeName"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="e.g., Joe's Coffee Shop"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="placeType">Type</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {commonPlaceTypes.map(type => (
                  <Badge
                    key={type}
                    variant={placeType === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPlaceType(placeType === type ? "" : type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <Input
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                placeholder="Or type custom category..."
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Miami, FL"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Why do you recommend this place?</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Great coffee and free WiFi. Perfect for meetings."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          {/* Preview */}
          {placeName && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-2">Preview:</p>
              <div className="text-sm space-y-1">
                <p className="font-medium">📍 {placeName} {placeType && `(${placeType})`}</p>
                {address && <p>📧 Address: {address}</p>}
                {description && <p>💭 {description}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex gap-3">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!placeName.trim()}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Share Recommendation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};