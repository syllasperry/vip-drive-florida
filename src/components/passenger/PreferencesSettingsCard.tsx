
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PreferencesData {
  preferred_temperature?: number;
  music_preference?: string;
  music_playlist_link?: string;
  interaction_preference?: string;
  trip_purpose?: string;
  additional_notes?: string;
}

interface PreferencesSettingsCardProps {
  onClose: () => void;
}

export const PreferencesSettingsCard = ({ onClose }: PreferencesSettingsCardProps) => {
  const [preferences, setPreferences] = useState<PreferencesData>({
    preferred_temperature: 72,
    music_preference: 'off',
    music_playlist_link: '',
    interaction_preference: 'no_preference',
    trip_purpose: 'leisure',
    additional_notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('passengers')
        .select('preferred_temperature, music_preference, music_playlist_link, interaction_preference, trip_purpose, additional_notes')
        .eq('auth_user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          preferred_temperature: data.preferred_temperature || 72,
          music_preference: data.music_preference || 'off',
          music_playlist_link: data.music_playlist_link || '',
          interaction_preference: data.interaction_preference || 'no_preference',
          trip_purpose: data.trip_purpose || 'leisure',
          additional_notes: data.additional_notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('passengers')
        .update({
          preferred_temperature: preferences.preferred_temperature,
          music_preference: preferences.music_preference,
          music_playlist_link: preferences.music_playlist_link,
          interaction_preference: preferences.interaction_preference,
          trip_purpose: preferences.trip_purpose,
          additional_notes: preferences.additional_notes
        })
        .eq('auth_user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temperature */}
        <div className="space-y-2">
          <Label>Preferred Temperature (°F)</Label>
          <div className="px-4">
            <Slider
              value={[preferences.preferred_temperature || 72]}
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, preferred_temperature: value[0] }))
              }
              max={80}
              min={60}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>60°F</span>
              <span className="font-medium">{preferences.preferred_temperature}°F</span>
              <span>80°F</span>
            </div>
          </div>
        </div>

        {/* Music Preference */}
        <div className="space-y-2">
          <Label>Music Preference</Label>
          <Select 
            value={preferences.music_preference} 
            onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, music_preference: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select music preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">On</SelectItem>
              <SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Playlist Link */}
        {preferences.music_preference === 'on' && (
          <div className="space-y-2">
            <Label>Playlist Link (Optional)</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={preferences.music_playlist_link}
              onChange={(e) => 
                setPreferences(prev => ({ ...prev, music_playlist_link: e.target.value }))
              }
            />
          </div>
        )}

        {/* Conversation Preference */}
        <div className="space-y-2">
          <Label>Conversation Preference</Label>
          <Select 
            value={preferences.interaction_preference} 
            onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, interaction_preference: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select conversation preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="talkative">Talkative</SelectItem>
              <SelectItem value="quiet">Quiet</SelectItem>
              <SelectItem value="no_preference">No Preference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trip Purpose */}
        <div className="space-y-2">
          <Label>Trip Purpose</Label>
          <Select 
            value={preferences.trip_purpose} 
            onValueChange={(value) => 
              setPreferences(prev => ({ ...prev, trip_purpose: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trip purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="leisure">Leisure</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label>Additional Notes</Label>
          <Textarea
            placeholder="Any special requests or preferences..."
            value={preferences.additional_notes}
            onChange={(e) => 
              setPreferences(prev => ({ ...prev, additional_notes: e.target.value }))
            }
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Back
          </Button>
          <Button onClick={savePreferences} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
