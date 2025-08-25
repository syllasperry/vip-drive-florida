import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Bell, User, Shield, HelpCircle, LogOut, Camera, Upload, Thermometer, Music, MessageCircle, MapPin, NotebookPen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PhotoUpload } from '@/components/profile/PhotoUpload';
import { uploadPassengerAvatar, savePassengerPreferences, getPassengerPreferences, PassengerPreferences } from '@/lib/api/passenger-preferences';

interface PassengerInfo {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  profile_photo_url?: string;
}

interface SettingsTabProps {
  passengerInfo: PassengerInfo;
  onUpdate: () => void;
}

export const SettingsTab = ({ passengerInfo, onUpdate }: SettingsTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    full_name: passengerInfo.full_name || '',
    phone: passengerInfo.phone || '',
  });
  const [preferences, setPreferences] = useState<PassengerPreferences>({
    air_conditioning: true,
    preferred_temperature: 72,
    temperature_unit: 'F',
    radio_on: true,
    preferred_music: 'no_preference',
    conversation_preference: 'no_preference',
    trip_purpose: 'business',
    trip_notes: ''
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await getPassengerPreferences();
      if (savedPreferences) {
        setPreferences(savedPreferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('passengers')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', passengerInfo.id);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setIsUploadingPhoto(true);
      const photoUrl = await uploadPassengerAvatar(file);
      
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      await savePassengerPreferences(preferences);
      toast({
        title: "Preferences Updated",
        description: "Your ride preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updatePreference = <K extends keyof PassengerPreferences>(
    key: K,
    value: PassengerPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/passenger/login';
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo Upload */}
          <div className="flex justify-center">
            <PhotoUpload
              currentPhotoUrl={passengerInfo.profile_photo_url}
              userName={passengerInfo.full_name || 'User'}
              onPhotoUpload={handlePhotoUpload}
              isUploading={isUploadingPhoto}
              size="lg"
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={passengerInfo.email}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ride Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ride Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Temperature */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-blue-600" />
              </div>
              <Label className="text-lg font-semibold text-gray-900">Climate</Label>
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
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-purple-600" />
              </div>
              <Label className="text-lg font-semibold text-gray-900">Music</Label>
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
                  <SelectTrigger className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-12">
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
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <Label className="text-lg font-semibold text-gray-900">Conversation</Label>
            </div>
            
            <RadioGroup
              value={preferences.conversation_preference}
              onValueChange={(value) => updatePreference('conversation_preference', value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                <RadioGroupItem value="friendly" id="friendly" />
                <Label htmlFor="friendly" className="text-sm font-medium text-gray-700 cursor-pointer">
                  😊 I enjoy chatting during rides
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                <RadioGroupItem value="quiet" id="quiet" />
                <Label htmlFor="quiet" className="text-sm font-medium text-gray-700 cursor-pointer">
                  🤫 I prefer quiet rides
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                <RadioGroupItem value="no_preference" id="no_pref" />
                <Label htmlFor="no_pref" className="text-sm font-medium text-gray-700 cursor-pointer">
                  🤷‍♂️ Depends on my mood
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Trip Purpose */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <Label className="text-lg font-semibold text-gray-900">Main purpose of your trips</Label>
            </div>
            
            <Select
              value={preferences.trip_purpose}
              onValueChange={(value) => updatePreference('trip_purpose', value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-12">
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
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <NotebookPen className="w-5 h-5 text-gray-600" />
              </div>
              <Label className="text-lg font-semibold text-gray-900">Special notes (optional)</Label>
            </div>
            
            <Textarea
              placeholder="Any special requests, allergies, or specific needs..."
              value={preferences.trip_notes}
              onChange={(e) => updatePreference('trip_notes', e.target.value)}
              rows={3}
              className="resize-none border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl"
            />
          </div>

          <Button
            onClick={handlePreferencesUpdate}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white"
          >
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <Switch
              id="email-notifications"
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, email: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <Switch
              id="push-notifications"
              checked={notifications.push}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, push: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notifications">SMS Notifications</Label>
            <Switch
              id="sms-notifications"
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, sms: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Two-Factor Authentication
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Download My Data
          </Button>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            FAQ
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Contact Support
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Terms of Service
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Privacy Policy
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
