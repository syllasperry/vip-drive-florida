
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PreferencesData {
  air_conditioning: boolean;
  preferred_temperature: number;
  temperature_unit: string;
  radio_on: boolean;
  preferred_music: string;
  conversation_preference: string;
  trip_purpose: string;
  trip_notes: string;
}

export const PreferencesSettingsCard = () => {
  const [preferences, setPreferences] = useState<PreferencesData>({
    air_conditioning: true,
    preferred_temperature: 72,
    temperature_unit: 'F',
    radio_on: false,
    preferred_music: '',
    conversation_preference: 'neutral',
    trip_purpose: 'leisure',
    trip_notes: ''
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
      const { data, error } = await supabase
        .from('passenger_preferences')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          air_conditioning: data.air_conditioning ?? true,
          preferred_temperature: data.preferred_temperature ?? 72,
          temperature_unit: data.temperature_unit ?? 'F',
          radio_on: data.radio_on ?? false,
          preferred_music: data.preferred_music ?? '',
          conversation_preference: data.conversation_preference ?? 'neutral',
          trip_purpose: data.trip_purpose ?? 'leisure',
          trip_notes: data.trip_notes ?? ''
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('passenger_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Preferences saved successfully"
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ride Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ride Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="air_conditioning">Air Conditioning</Label>
            <Switch
              id="air_conditioning"
              checked={preferences.air_conditioning}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, air_conditioning: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Temperature: {preferences.preferred_temperature}°{preferences.temperature_unit}</Label>
            <Slider
              value={[preferences.preferred_temperature]}
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, preferred_temperature: value[0] }))
              }
              max={85}
              min={60}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="radio_on">Music/Radio</Label>
            <Switch
              id="radio_on"
              checked={preferences.radio_on}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, radio_on: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversation_preference">Conversation Preference</Label>
            <Select
              value={preferences.conversation_preference}
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, conversation_preference: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiet">Prefer quiet ride</SelectItem>
                <SelectItem value="neutral">No preference</SelectItem>
                <SelectItem value="chatty">Enjoy conversation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip_purpose">Trip Purpose</Label>
            <Select
              value={preferences.trip_purpose}
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, trip_purpose: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="leisure">Leisure</SelectItem>
                <SelectItem value="airport">Airport transfer</SelectItem>
                <SelectItem value="medical">Medical appointment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip_notes">Additional Notes</Label>
            <Textarea
              id="trip_notes"
              placeholder="Any special requests or notes for your driver..."
              value={preferences.trip_notes}
              onChange={(e) => 
                setPreferences(prev => ({ ...prev, trip_notes: e.target.value }))
              }
            />
          </div>
        </div>

        <Button 
          onClick={savePreferences}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
};
