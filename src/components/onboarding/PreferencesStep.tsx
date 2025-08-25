
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Thermometer, Music, MessageCircle, MapPin, NotebookPen } from 'lucide-react';

export interface PassengerPreferences {
  air_conditioning: boolean;
  preferred_temperature: number;
  temperature_unit: string;
  radio_on: boolean;
  preferred_music: string;
  conversation_preference: string;
  trip_purpose: string;
  trip_notes: string;
}

interface PreferencesStepProps {
  preferences: PassengerPreferences;
  onPreferencesChange: (preferences: PassengerPreferences) => void;
}

export const PreferencesStep: React.FC<PreferencesStepProps> = ({
  preferences,
  onPreferencesChange
}) => {
  const updatePreference = <K extends keyof PassengerPreferences>(
    key: K,
    value: PassengerPreferences[K]
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your preferences
        </h3>
        <p className="text-gray-600 text-sm">
          This helps us provide the best ride experience for you
        </p>
      </div>

      <div className="space-y-8">
        {/* Temperature */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-blue-600" />
            </div>
            <Label className="text-lg font-medium text-gray-900">Climate</Label>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="air-conditioning" className="text-sm font-medium text-gray-700">
              Air conditioning
            </Label>
            <Switch
              id="air-conditioning"
              checked={preferences.air_conditioning}
              onCheckedChange={(checked) => updatePreference('air_conditioning', checked)}
            />
          </div>

          {preferences.air_conditioning && (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <Label className="text-sm font-medium text-gray-700">
                Preferred temperature: {preferences.preferred_temperature}°{preferences.temperature_unit}
              </Label>
              <div className="px-2">
                <Slider
                  value={[preferences.preferred_temperature]}
                  onValueChange={(value) => updatePreference('preferred_temperature', value[0])}
                  max={85}
                  min={60}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>60°F (Cool)</span>
                  <span>85°F (Warm)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Music */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Music className="w-5 h-5 text-purple-600" />
            </div>
            <Label className="text-lg font-medium text-gray-900">Music</Label>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="radio-on" className="text-sm font-medium text-gray-700">
              I enjoy music during rides
            </Label>
            <Switch
              id="radio-on"
              checked={preferences.radio_on}
              onCheckedChange={(checked) => updatePreference('radio_on', checked)}
            />
          </div>

          {preferences.radio_on && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <Label className="text-sm font-medium text-gray-700">Preferred style</Label>
              <Select
                value={preferences.preferred_music}
                onValueChange={(value) => updatePreference('preferred_music', value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg">
                  <SelectValue placeholder="Choose a style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_preference">No preference</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="off">Prefer silence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <Label className="text-lg font-medium text-gray-900">Conversation</Label>
          </div>
          
          <RadioGroup
            value={preferences.conversation_preference}
            onValueChange={(value) => updatePreference('conversation_preference', value)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-white transition-colors">
              <RadioGroupItem value="friendly" id="friendly" />
              <Label htmlFor="friendly" className="text-sm font-medium text-gray-700 cursor-pointer">
                😊 I enjoy chatting during rides
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-white transition-colors">
              <RadioGroupItem value="quiet" id="quiet" />
              <Label htmlFor="quiet" className="text-sm font-medium text-gray-700 cursor-pointer">
                🤫 I prefer quiet rides
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-white transition-colors">
              <RadioGroupItem value="no_preference" id="no_pref" />
              <Label htmlFor="no_pref" className="text-sm font-medium text-gray-700 cursor-pointe">
                🤷‍♂️ Depends on my mood
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Trip Purpose */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <Label className="text-lg font-medium text-gray-900">Main purpose of your trips</Label>
          </div>
          
          <Select
            value={preferences.trip_purpose}
            onValueChange={(value) => updatePreference('trip_purpose', value)}
          >
            <SelectTrigger className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg">
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="leisure">Leisure</SelectItem>
              <SelectItem value="airport">Airport</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Notes */}
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <NotebookPen className="w-5 h-5 text-gray-600" />
            </div>
            <Label className="text-lg font-medium text-gray-900">Special notes (optional)</Label>
          </div>
          
          <Textarea
            placeholder="Any special requests, allergies, or specific needs..."
            value={preferences.trip_notes}
            onChange={(e) => updatePreference('trip_notes', e.target.value)}
            rows={3}
            className="resize-none border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
