
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Thermometer, Radio, MessageCircle, MapPin } from "lucide-react";

interface PreferencesData {
  air_conditioning?: boolean;
  preferred_temperature?: number;
  temperature_unit?: string;
  radio_on?: boolean;
  preferred_music?: string;
  conversation_preference?: string;
  trip_purpose?: string;
  trip_notes?: string;
}

export const PreferencesSettingsCard = () => {
  const [preferences, setPreferences] = useState<PreferencesData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_my_passenger_preferences').maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
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
      const { error } = await supabase.rpc('upsert_my_passenger_preferences', {
        _air_conditioning: preferences.air_conditioning || false,
        _preferred_temperature: preferences.preferred_temperature || 72,
        _temperature_unit: preferences.temperature_unit || 'F',
        _radio_on: preferences.radio_on || false,
        _preferred_music: preferences.preferred_music || '',
        _conversation_preference: preferences.conversation_preference || '',
        _trip_purpose: preferences.trip_purpose || '',
        _trip_notes: preferences.trip_notes || ''
      });

      if (error) throw error;

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
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Ride Preferences</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Climate Control */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4 w-4" />
            <Label className="text-base font-medium">Climate Control</Label>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="ac">Air Conditioning</Label>
            <Switch
              id="ac"
              checked={preferences.air_conditioning || false}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, air_conditioning: checked }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temp">Preferred Temperature</Label>
              <Input
                id="temp"
                type="number"
                value={preferences.preferred_temperature || 72}
                onChange={(e) => 
                  setPreferences(prev => ({ ...prev, preferred_temperature: parseInt(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select 
                value={preferences.temperature_unit || 'F'} 
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, temperature_unit: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Fahrenheit</SelectItem>
                  <SelectItem value="C">Celsius</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Entertainment */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Radio className="h-4 w-4" />
            <Label className="text-base font-medium">Entertainment</Label>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="radio">Radio/Music</Label>
            <Switch
              id="radio"
              checked={preferences.radio_on || false}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, radio_on: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="music">Preferred Music</Label>
            <Input
              id="music"
              value={preferences.preferred_music || ''}
              onChange={(e) => 
                setPreferences(prev => ({ ...prev, preferred_music: e.target.value }))
              }
              placeholder="e.g., Jazz, Classical, No preference"
            />
          </div>
        </div>

        {/* Communication */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <Label className="text-base font-medium">Communication</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="conversation">Conversation Preference</Label>
            <Select 
              value={preferences.conversation_preference || ''} 
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, conversation_preference: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatty">I enjoy conversation</SelectItem>
                <SelectItem value="quiet">I prefer quiet rides</SelectItem>
                <SelectItem value="no_preference">No preference</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <Label className="text-base font-medium">Trip Details</Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purpose">Trip Purpose</Label>
            <Select 
              value={preferences.trip_purpose || ''} 
              onValueChange={(value) => 
                setPreferences(prev => ({ ...prev, trip_purpose: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="leisure">Leisure</SelectItem>
                <SelectItem value="airport">Airport Transfer</SelectItem>
                <SelectItem value="event">Special Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={preferences.trip_notes || ''}
              onChange={(e) => 
                setPreferences(prev => ({ ...prev, trip_notes: e.target.value }))
              }
              placeholder="Any special requests or preferences..."
              rows={3}
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
