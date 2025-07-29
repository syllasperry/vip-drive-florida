import { useState, useEffect } from "react";
import { X, Thermometer, Music, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RidePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const RidePreferencesModal = ({ isOpen, onClose, userId }: RidePreferencesModalProps) => {
  const [preferences, setPreferences] = useState({
    temperature: [72], // Fahrenheit
    musicEnabled: true,
    conversationPreference: 'depends', // 'likes', 'prefers_silence', 'depends'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      loadPreferences();
    }
  }, [isOpen, userId]);

  const loadPreferences = async () => {
    try {
      const { data } = await supabase
        .from('passengers')
        .select('preferred_temperature, music_preference, interaction_preference')
        .eq('id', userId)
        .single();

      if (data) {
        setPreferences({
          temperature: [data.preferred_temperature || 72],
          musicEnabled: data.music_preference !== 'no_music',
          conversationPreference: data.interaction_preference || 'depends',
        });
      }
    } catch (error) {
      console.error('Error loading ride preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      const updateData = {
        preferred_temperature: preferences.temperature[0],
        music_preference: preferences.musicEnabled ? 'likes_music' : 'no_music',
        interaction_preference: preferences.conversationPreference,
      };

      const { error } = await supabase
        .from('passengers')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your ride preferences have been updated successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving ride preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">
              Ride Preferences
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Temperature Preference */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-primary" />
              <Label className="text-card-foreground font-medium">
                Preferred Temperature
              </Label>
            </div>
            <div className="space-y-3">
              <Slider
                value={preferences.temperature}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, temperature: value }))}
                max={85}
                min={60}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>60°F</span>
                <span className="font-medium text-primary">
                  {preferences.temperature[0]}°F
                </span>
                <span>85°F</span>
              </div>
            </div>
          </div>

          {/* Music Preference */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Music className="h-4 w-4 text-primary" />
              <Label className="text-card-foreground font-medium">
                Music During Ride
              </Label>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="music-enabled" className="text-card-foreground">
                I enjoy music during rides
              </Label>
              <Switch
                id="music-enabled"
                checked={preferences.musicEnabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, musicEnabled: checked }))
                }
              />
            </div>
          </div>

          {/* Conversation Preference */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <Label className="text-card-foreground font-medium">
                Conversation Preference
              </Label>
            </div>
            <RadioGroup
              value={preferences.conversationPreference}
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, conversationPreference: value }))
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="likes" id="likes" />
                <Label htmlFor="likes" className="text-card-foreground">
                  I enjoy chatting with my driver
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prefers_silence" id="silence" />
                <Label htmlFor="silence" className="text-card-foreground">
                  I prefer a quiet, peaceful ride
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="depends" id="depends" />
                <Label htmlFor="depends" className="text-card-foreground">
                  It depends on my mood/occasion
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border space-y-3">
          <Button 
            onClick={savePreferences}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};