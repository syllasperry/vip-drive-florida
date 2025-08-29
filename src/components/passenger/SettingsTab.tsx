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
import { Bell, User, Shield, HelpCircle, LogOut, Camera, Upload, Thermometer, Music, MessageCircle, MapPin, NotebookPen, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PhotoUpload } from '@/components/profile/PhotoUpload';
import { uploadPassengerAvatar, savePassengerPreferences, getPassengerPreferences, PassengerPreferences } from '@/lib/api/passenger-preferences';
import { HelpSupportModal, HelpContent } from '@/components/ui/help-support-modal';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';
import { TwoFactorAuthModal } from '@/components/modals/TwoFactorAuthModal';
import { PhoneVerificationModal } from '@/components/modals/PhoneVerificationModal';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { PushNotificationInfoModal } from '@/components/modals/PushNotificationInfoModal';
import { usePushNotificationSettings } from '@/hooks/usePushNotificationSettings';

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
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
  const [showPushInfoModal, setShowPushInfoModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: passengerInfo.full_name || '',
    phone: passengerInfo.phone || '',
  });
  const [preferences, setPreferences] = useState<PassengerPreferences>({
    air_conditioning: true,
    preferred_temperature: 71,
    temperature_unit: 'F',
    radio_on: false,
    preferred_music: 'no_preference',
    conversation_preference: 'depends',
    trip_purpose: 'other',
    trip_notes: ''
  });
  const { toast } = useToast();
  const { 
    preferences: notifications, 
    isLoading: notificationsLoading, 
    isUpdating: notificationsUpdating,
    updatePreference: updateNotificationPreference 
  } = useNotificationPreferences();

  const { 
    pushEnabled, 
    isLoading: pushLoading, 
    isUpdating: pushUpdating,
    updatePushSetting,
    sendTestNotification
  } = usePushNotificationSettings();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      console.log('Loading preferences for user...');
      const savedPreferences = await getPassengerPreferences();
      if (savedPreferences) {
        console.log('Loaded preferences:', savedPreferences);
        setPreferences(savedPreferences);
      } else {
        console.log('No saved preferences found, using defaults');
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
      setIsSavingPreferences(true);
      console.log('=== SAVING PREFERENCES ===');
      console.log('Current preferences state:', preferences);
      
      // Log the trip purpose value specifically to debug the issue
      console.log('Trip purpose value being saved:', preferences.trip_purpose);
      
      await savePassengerPreferences(preferences);
      console.log('=== PREFERENCES SAVED SUCCESSFULLY ===');
      
      toast({
        title: "Preferences Updated",
        description: "Your ride preferences have been saved successfully.",
      });

      // Reload preferences to confirm they were saved and update UI
      await loadPreferences();
      
    } catch (error) {
      console.error('=== PREFERENCES SAVE FAILED ===');
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preferences. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const updatePreference = <K extends keyof PassengerPreferences>(
    key: K,
    value: PassengerPreferences[K]
  ) => {
    console.log(`Updating preference ${key}:`, value);
    setPreferences(prev => {
      const updated = {
        ...prev,
        [key]: value
      };
      console.log('Updated preferences state:', updated);
      return updated;
    });
  };

  const handleNotificationToggle = async (key: 'email' | 'push' | 'sms', value: boolean) => {
    const result = await updateNotificationPreference(key, value);
    
    if (result === 'phone_verification_required') {
      setShowPhoneVerificationModal(true);
    }
  };

  const handlePhoneVerified = () => {
    toast({
      title: "SMS Notifications Enabled",
      description: "You'll now receive SMS notifications for ride updates",
    });
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

  const helpContent = {
    faq: `**What is VIP Chauffeur Service?**
VIP Chauffeur is a premium ride service designed to provide safe, reliable, and comfortable transportation with professional drivers.

**How do I book a ride?**
Select pickup & drop-off, confirm ride details, and pay through our secure checkout.

**Can I cancel my booking? Will I be charged?**
Yes. Cancellations less than 6 hours before pickup may incur a cancellation fee.

**What payment methods are accepted?**
All major credit/debit cards via Stripe.

**How do I contact my driver?**
After payment, your booking card shows your driver's photo, name, phone, and email with shortcuts to call, text, or email.

**What if my driver is late?**
We monitor rides; you'll receive updates and scheduling adjustments if needed.

**Is my ride insured?**
Yes, rides are covered by commercial insurance.`,
    
    contact: `Need help with your ride? Our support team is available 24/7.

📧 **Email:** support@vipchauffeur.com (tap to open mail client)
📞 **Phone:** +1 (555) 123-4567 (tap to call)
💬 **Text Message:** Tap to open SMS composer`,
    
    terms: `By using the VIP Chauffeur app, you agree to:

1. **Service Use:** Personal, lawful transportation only.
2. **Passenger Responsibility:** Provide accurate info, be on time, maintain respectful behavior.
3. **Company Responsibility:** Deliver safe, high-quality, professional service.
4. **Cancellations:** Less than 6 hours before pickup may incur fees.
5. **Liability:** Not responsible for delays due to traffic, weather, or unforeseen events.

Confirming a booking means you accept these terms.`,
    
    privacy: `1. **Data Collected:** Name, phone, email, ride details (pickup/drop-off), preferences.
2. **Data Use:** To process bookings, connect you with your driver, and improve the service.
3. **Data Sharing:** Only with your assigned driver and Stripe; never sold.
4. **Data Security:** Encrypted and securely stored.
5. **Your Rights:** Request to view, edit, or delete your data via Support.`
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
                <RadioGroupItem value="chatty" id="chatty" />
                <Label htmlFor="chatty" className="text-sm font-medium text-gray-700 cursor-pointer">
                  😊 I enjoy chatting during rides
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                <RadioGroupItem value="prefers_silence" id="prefers_silence" />
                <Label htmlFor="prefers_silence" className="text-sm font-medium text-gray-700 cursor-pointer">
                  🤫 I prefer quiet rides
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:bg-white transition-colors">
                <RadioGroupItem value="depends" id="depends" />
                <Label htmlFor="depends" className="text-sm font-medium text-gray-700 cursor-pointer">
                  🤷‍♂️ Depends on my mood
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Trip Purpose - FIXED to ensure correct value mapping */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <Label className="text-lg font-semibold text-gray-900">Main purpose of your trips</Label>
            </div>
            
            <Select
              value={preferences.trip_purpose}
              onValueChange={(value) => {
                console.log('Trip purpose selected in UI:', value);
                updatePreference('trip_purpose', value);
              }}
            >
              <SelectTrigger className="border-gray-300 focus:border-[#FF385C] focus:ring-[#FF385C] rounded-xl h-12">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="leisure">Leisure</SelectItem>
                <SelectItem value="airport">Airport</SelectItem>
                <SelectItem value="events">Events</SelectItem>
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
            disabled={isSavingPreferences}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white"
          >
            {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
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
              onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
              disabled={notificationsLoading || notificationsUpdating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 rounded-full hover:bg-gray-100"
                onClick={() => setShowPushInfoModal(true)}
              >
                <Info className="h-3 w-3 text-gray-400" />
              </Button>
            </div>
            <Switch
              id="push-notifications"
              checked={pushEnabled}
              onCheckedChange={updatePushSetting}
              disabled={pushLoading || pushUpdating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notifications">SMS Notifications</Label>
            <Switch
              id="sms-notifications"
              checked={notifications.sms}
              onCheckedChange={(checked) => handleNotificationToggle('sms', checked)}
              disabled={notificationsLoading || notificationsUpdating}
            />
          </div>
          
          {/* Test Notification Button - Development Only */}
          {process.env.NODE_ENV === 'development' && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={sendTestNotification}
                disabled={!pushEnabled}
                className="w-full"
              >
                Send Test Notification
              </Button>
            </div>
          )}
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
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setShowChangePasswordModal(true)}
          >
            Change Password
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setShowTwoFactorModal(true)}
          >
            Two-Factor Authentication
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
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveModal('faq')}
          >
            FAQ
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveModal('contact')}
          >
            Contact Support
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveModal('terms')}
          >
            Terms of Service
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setActiveModal('privacy')}
          >
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

      {/* Help & Support Modals */}
      <HelpSupportModal
        isOpen={activeModal === 'faq'}
        onClose={() => setActiveModal(null)}
        title="Frequently Asked Questions"
      >
        <HelpContent content={helpContent.faq} />
      </HelpSupportModal>

      <HelpSupportModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        title="Contact Support"
      >
        <HelpContent content={helpContent.contact} />
      </HelpSupportModal>

      <HelpSupportModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
      >
        <HelpContent content={helpContent.terms} />
      </HelpSupportModal>

      <HelpSupportModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
      >
        <HelpContent content={helpContent.privacy} />
      </HelpSupportModal>

      {/* Privacy & Security Modals */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      <TwoFactorAuthModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
      />

      <PhoneVerificationModal
        isOpen={showPhoneVerificationModal}
        onClose={() => setShowPhoneVerificationModal(false)}
        onVerified={handlePhoneVerified}
      />

      <PushNotificationInfoModal
        isOpen={showPushInfoModal}
        onClose={() => setShowPushInfoModal(false)}
      />
    </div>
  );
};