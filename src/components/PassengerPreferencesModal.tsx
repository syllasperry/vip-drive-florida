import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PassengerPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdate: () => void;
}

const PassengerPreferencesModal: React.FC<PassengerPreferencesModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    preferred_temperature: 72,
    music_preference: '',
    music_playlist_link: '',
    interaction_preference: '',
    trip_purpose: '',
    additional_notes: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        preferred_temperature: userProfile.preferred_temperature || 72,
        music_preference: userProfile.music_preference || '',
        music_playlist_link: userProfile.music_playlist_link || '',
        interaction_preference: userProfile.interaction_preference || '',
        trip_purpose: userProfile.trip_purpose || '',
        additional_notes: userProfile.additional_notes || ''
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('passengers')
        .update({
          preferred_temperature: formData.preferred_temperature,
          music_preference: formData.music_preference,
          music_playlist_link: formData.music_playlist_link,
          interaction_preference: formData.interaction_preference,
          trip_purpose: formData.trip_purpose,
          additional_notes: formData.additional_notes
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast.success('Preferences updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ride Preferences</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Temperature */}
          <div className="space-y-2">
            <Label>Preferred Temperature (°F)</Label>
            <div className="px-4">
              <Slider
                value={[formData.preferred_temperature]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_temperature: value[0] }))}
                max={85}
                min={60}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>60°F</span>
                <span className="font-medium">{formData.preferred_temperature}°F</span>
                <span>85°F</span>
              </div>
            </div>
          </div>

          {/* Music Preference */}
          <div className="space-y-3">
            <Label>Music Preference</Label>
            <Select value={formData.music_preference} onValueChange={(value) => setFormData(prev => ({ ...prev, music_preference: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select music preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No preference</SelectItem>
                <SelectItem value="no_sound">🔇 Sound off</SelectItem>
                <SelectItem value="ambient">🎵 Ambient music</SelectItem>
                <SelectItem value="radio">📻 Local radio</SelectItem>
                <SelectItem value="playlist">🎧 Custom playlist</SelectItem>
              </SelectContent>
            </Select>
            
            {formData.music_preference === 'playlist' && (
              <div className="space-y-2">
                <Label>Playlist Link (Spotify, Apple Music, etc.)</Label>
                <Input
                  placeholder="https://..."
                  value={formData.music_playlist_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, music_playlist_link: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* Interaction Preference */}
          <div className="space-y-3">
            <Label>Interaction with Driver</Label>
            <RadioGroup 
              value={formData.interaction_preference} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, interaction_preference: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="chatty" id="chatty" />
                <Label htmlFor="chatty">😊 I enjoy conversation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="quiet" id="quiet" />
                <Label htmlFor="quiet">🤫 I prefer quiet rides</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="working" id="working" />
                <Label htmlFor="working">💼 I'll be working/focused</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Trip Purpose */}
          <div className="space-y-2">
            <Label>Typical Trip Purpose (Optional)</Label>
            <Select value={formData.trip_purpose} onValueChange={(value) => setFormData(prev => ({ ...prev, trip_purpose: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No preference</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="leisure">Leisure</SelectItem>
                <SelectItem value="airport">Airport transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any special requests or preferences..."
              value={formData.additional_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PassengerPreferencesModal;