
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

export const PreferencesSettingsCard = () => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('passengers')
        .select('preferred_temperature, music_preference, music_playlist_link, interaction_preference, trip_purpose, additional_notes')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading preferences:', error);
        return;
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
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        <CardTitle>Preferences</CardTitle>
        <p className="text-sm text-gray-600">Account preferences</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="temperature">Preferred Temperature (°F)</Label>
          <div className="px-3">
            <Slider
              id="temperature"
              min={60}
              max={80}
              step={1}
              value={[preferences.preferred_temperature || 72]}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, preferred_temperature: value[0] }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>60°F</span>
              <span>{preferences.preferred_temperature}°F</span>
              <span>80°F</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="music">Music Preference</Label>
          <Select 
            value={preferences.music_preference} 
            onValueChange={(value) => setPreferences(prev => ({ ...prev, music_preference: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select music preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">Music On</SelectItem>
              <SelectItem value="off">Music Off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {preferences.music_preference === 'on' && (
          <div className="space-y-2">
            <Label htmlFor="playlist">Music Playlist Link</Label>
            <Input
              id="playlist"
              placeholder="Enter Spotify, Apple Music, or YouTube playlist URL"
              value={preferences.music_playlist_link}
              onChange={(e) => setPreferences(prev => ({ ...prev, music_playlist_link: e.target.value }))}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="interaction">Interaction Preference</Label>
          <Select 
            value={preferences.interaction_preference} 
            onValueChange={(value) => setPreferences(prev => ({ ...prev, interaction_preference: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interaction preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="talkative">Talkative</SelectItem>
              <SelectItem value="quiet">Quiet</SelectItem>
              <SelectItem value="no_preference">No Preference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">Trip Purpose</Label>
          <Select 
            value={preferences.trip_purpose} 
            onValueChange={(value) => setPreferences(prev => ({ ...prev, trip_purpose: value }))}
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

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any special requests or additional information..."
            value={preferences.additional_notes}
            onChange={(e) => setPreferences(prev => ({ ...prev, additional_notes: e.target.value }))}
            rows={3}
          />
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
