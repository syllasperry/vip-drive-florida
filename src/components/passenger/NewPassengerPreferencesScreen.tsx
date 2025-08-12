
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Thermometer, Music, MessageCircle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewPassengerPreferencesScreenProps {
  onBack: () => void;
  userId: string;
}

export const NewPassengerPreferencesScreen = ({ onBack, userId }: NewPassengerPreferencesScreenProps) => {
  const [preferences, setPreferences] = useState({
    airConditioning: true,
    temperature: [72],
    temperatureUnit: 'F' as 'F' | 'C',
    radioOn: false,
    preferredMusic: '',
    conversationLevel: 'neutral' as 'quiet' | 'neutral' | 'chatty',
    tripPurpose: 'leisure' as 'leisure' | 'business' | 'event' | 'other',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('passenger_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          airConditioning: data.air_conditioning ?? true,
          temperature: [data.preferred_temperature || 72],
          temperatureUnit: data.temperature_unit as 'F' | 'C' || 'F',
          radioOn: data.radio_on ?? false,
          preferredMusic: data.preferred_music || '',
          conversationLevel: data.conversation_preference as 'quiet' | 'neutral' | 'chatty' || 'neutral',
          tripPurpose: data.trip_purpose as 'leisure' | 'business' | 'event' | 'other' || 'leisure',
          notes: data.trip_notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        user_id: userId,
        air_conditioning: preferences.airConditioning,
        preferred_temperature: preferences.temperature[0],
        temperature_unit: preferences.temperatureUnit,
        radio_on: preferences.radioOn,
        preferred_music: preferences.preferredMusic || null,
        conversation_preference: preferences.conversationLevel,
        trip_purpose: preferences.tripPurpose,
        trip_notes: preferences.notes || null
      };

      const { error } = await supabase
        .from('passenger_preferences')
        .upsert(updateData);

      if (error) throw error;

      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const convertTemperature = (temp: number, fromUnit: 'F' | 'C', toUnit: 'F' | 'C') => {
    if (fromUnit === toUnit) return temp;
    if (fromUnit === 'F' && toUnit === 'C') return Math.round((temp - 32) * 5/9);
    if (fromUnit === 'C' && toUnit === 'F') return Math.round((temp * 9/5) + 32);
    return temp;
  };

  const handleTemperatureUnitToggle = () => {
    const newUnit = preferences.temperatureUnit === 'F' ? 'C' : 'F';
    const convertedTemp = convertTemperature(preferences.temperature[0], preferences.temperatureUnit, newUnit);
    
    setPreferences(prev => ({
      ...prev,
      temperatureUnit: newUnit,
      temperature: [convertedTemp]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-card-foreground">Passenger Preferences</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* A/C & Temperature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              Air Conditioning & Temperature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ac-toggle">Air Conditioning</Label>
              <Switch
                id="ac-toggle"
                checked={preferences.airConditioning}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, airConditioning: checked }))
                }
              />
            </div>
            
            {preferences.airConditioning && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTemperatureUnitToggle}
                  >
                    °{preferences.temperatureUnit}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Slider
                    value={preferences.temperature}
                    onValueChange={(value) => 
                      setPreferences(prev => ({ ...prev, temperature: value }))
                    }
                    max={preferences.temperatureUnit === 'F' ? 80 : 27}
                    min={preferences.temperatureUnit === 'F' ? 60 : 15}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{preferences.temperatureUnit === 'F' ? '60°F' : '15°C'}</span>
                    <span className="font-medium text-primary">
                      {preferences.temperature[0]}°{preferences.temperatureUnit}
                    </span>
                    <span>{preferences.temperatureUnit === 'F' ? '80°F' : '27°C'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Radio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="radio-toggle">Radio On/Off</Label>
              <Switch
                id="radio-toggle"
                checked={preferences.radioOn}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, radioOn: checked }))
                }
              />
            </div>
            
            {preferences.radioOn && (
              <div className="space-y-2">
                <Label htmlFor="music-input">Preferred Music / Playlist</Label>
                <Input
                  id="music-input"
                  placeholder="e.g., Jazz, Classical, Spotify playlist link..."
                  value={preferences.preferredMusic}
                  onChange={(e) => 
                    setPreferences(prev => ({ ...prev, preferredMusic: e.target.value }))
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Conversation Preference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Conversation Preference</Label>
              <Select 
                value={preferences.conversationLevel} 
                onValueChange={(value: 'quiet' | 'neutral' | 'chatty') => 
                  setPreferences(prev => ({ ...prev, conversationLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiet">🤫 Quiet - Prefer silence</SelectItem>
                  <SelectItem value="neutral">😊 Neutral - Depends on mood</SelectItem>
                  <SelectItem value="chatty">💬 Chatty - Enjoy conversation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trip Purpose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Trip Purpose
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Typical Trip Purpose</Label>
              <Select 
                value={preferences.tripPurpose} 
                onValueChange={(value: 'leisure' | 'business' | 'event' | 'other') => 
                  setPreferences(prev => ({ ...prev, tripPurpose: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leisure">🌴 Leisure</SelectItem>
                  <SelectItem value="business">💼 Business</SelectItem>
                  <SelectItem value="event">🎉 Event</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-input">Additional Notes (Optional)</Label>
              <Textarea
                id="notes-input"
                placeholder="Any special requests or preferences..."
                value={preferences.notes}
                onChange={(e) => 
                  setPreferences(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={savePreferences}
          className="w-full"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
};
