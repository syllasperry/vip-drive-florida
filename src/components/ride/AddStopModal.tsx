import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import GoogleMapsAutocomplete from '@/components/GoogleMapsAutocomplete';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  existingStops?: any[];
  onStopsUpdated?: (stops: any[]) => void;
}

export const AddStopModal = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  existingStops = [],
  onStopsUpdated 
}: AddStopModalProps) => {
  const [stops, setStops] = useState<string[]>(existingStops.map(stop => stop.address || stop) || ['']);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStopChange = (index: number, address: string) => {
    const newStops = [...stops];
    newStops[index] = address;
    setStops(newStops);
  };

  const addStop = () => {
    setStops([...stops, '']);
  };

  const removeStop = (index: number) => {
    if (stops.length > 1) {
      const newStops = stops.filter((_, i) => i !== index);
      setStops(newStops);
    }
  };

  const handleSave = async () => {
    const validStops = stops.filter(stop => stop.trim() !== '');
    
    if (validStops.length === 0) {
      toast({
        title: "No stops added",
        description: "Please add at least one stop or cancel.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Format stops for database
      const formattedStops = validStops.map(address => ({ address }));
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          extra_stops: formattedStops,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      toast({
        title: "Stops added successfully",
        description: `Added ${validStops.length} stop(s) to your ride.`
      });

      onStopsUpdated?.(formattedStops);
      onClose();
    } catch (error) {
      console.error('Error updating stops:', error);
      toast({
        title: "Failed to add stops",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStops(existingStops.map(stop => stop.address || stop) || ['']);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Optional Stops</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Add stops along your route. Your driver will be notified of these additional destinations.
          </p>
          
          {stops.map((stop, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <GoogleMapsAutocomplete
                  value={stop}
                  onChange={(address) => handleStopChange(index, address)}
                  placeholder={`Stop ${index + 1} address`}
                />
              </div>
              {stops.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStop(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            variant="outline"
            onClick={addStop}
            className="w-full flex items-center gap-2"
            disabled={stops.length >= 5} // Limit to 5 stops
          >
            <Plus className="h-4 w-4" />
            Add Another Stop {stops.length >= 5 && "(Max 5)"}
          </Button>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Stops'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};