
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Bell, Shield, HelpCircle, LogOut, Settings as SettingsIcon, User, Camera, Upload, Save, Loader2 } from "lucide-react";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { PrivacySecurityCard } from "./PrivacySecurityCard";
import { HelpSupportCard } from "./HelpSupportCard";
import { ProfileSettingsCard } from "./ProfileSettingsCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SettingsTabProps {
  passengerInfo: any;
}

export const SettingsTab = ({ passengerInfo }: SettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<'notifications' | 'privacy' | 'help' | 'preferences' | 'editProfile' | null>(null);
  const [currentPassengerInfo, setCurrentPassengerInfo] = useState(passengerInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    profilePhotoUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update local state when passengerInfo prop changes
  useEffect(() => {
    setCurrentPassengerInfo(passengerInfo);
  }, [passengerInfo]);

  // Load profile data when editing profile
  useEffect(() => {
    if (activeModal === 'editProfile' && currentPassengerInfo) {
      const nameParts = currentPassengerInfo.full_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfileData({
        firstName,
        lastName,
        phone: currentPassengerInfo.phone || '',
        email: currentPassengerInfo.email || '',
        profilePhotoUrl: currentPassengerInfo.profile_photo_url || ''
      });
    }
  }, [activeModal, currentPassengerInfo]);

  const handleProfileUpdate = async () => {
    // Refresh passenger info after profile update
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: passenger, error } = await supabase
          .from('passengers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && passenger) {
          setCurrentPassengerInfo(passenger);
        }
      }
    } catch (error) {
      console.error('Error refreshing passenger info:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/passenger/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get the best available photo URL with fallbacks
  const getPhotoUrl = () => {
    if (previewUrl) return previewUrl;
    if (profileData.profilePhotoUrl) return profileData.profilePhotoUrl;
    if (currentPassengerInfo?.profile_photo_url) return currentPassengerInfo.profile_photo_url;
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPG, PNG, GIF, WebP)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large", 
          description: "File size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!currentPassengerInfo?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${currentPassengerInfo.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!currentPassengerInfo?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      let photoUrl = profileData.profilePhotoUrl;

      // Upload photo if a new one was selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          photoUrl = await uploadPhoto(selectedFile);
        } catch (error) {
          console.error('Photo upload failed:', error);
          toast({
            title: "Photo upload failed",
            description: "Failed to upload photo. Saving other changes.",
            variant: "destructive"
          });
        } finally {
          setIsUploading(false);
        }
      }

      // Prepare update data
      const fullName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim();
      const updateData: any = {
        full_name: fullName || currentPassengerInfo.full_name,
        phone: profileData.phone.trim() || null,
        email: profileData.email.trim() || currentPassengerInfo.email
      };

      if (photoUrl) {
        updateData.profile_photo_url = photoUrl;
      }

      // Update passenger profile
      const { error } = await supabase
        .from('passengers')
        .update(updateData)
        .eq('id', currentPassengerInfo.id);

      if (error) throw error;

      // Update local state
      setProfileData(prev => ({
        ...prev,
        profilePhotoUrl: photoUrl || prev.profilePhotoUrl
      }));

      // Clear file selection
      setSelectedFile(null);
      setPreviewUrl(null);
      setActiveModal(null);

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      // Refresh data
      await handleProfileUpdate();

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (currentPassengerInfo) {
      const nameParts = currentPassengerInfo.full_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfileData({
        firstName,
        lastName,
        phone: currentPassengerInfo.phone || '',
        email: currentPassengerInfo.email || '',
        profilePhotoUrl: currentPassengerInfo.profile_photo_url || ''
      });
    }

    // Clear file selection
    setSelectedFile(null);
    setPreviewUrl(null);
    setActiveModal(null);
  };

  const triggerFileInput = () => {
    document.getElementById('profile-photo-input')?.click();
  };

  const triggerCameraInput = () => {
    document.getElementById('profile-camera-input')?.click();
  };

  if (activeModal === 'notifications') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <NotificationSettingsCard 
          userId={currentPassengerInfo?.id} 
          onClose={() => setActiveModal(null)} 
        />
      </div>
    );
  }

  if (activeModal === 'privacy') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <PrivacySecurityCard onClose={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'help') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <HelpSupportCard onClose={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'preferences') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <ProfileSettingsCard 
          passengerInfo={currentPassengerInfo}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    );
  }

  if (activeModal === 'editProfile') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Edit Passenger Profile</h3>
            </div>

            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={getPhotoUrl() || undefined} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-lg">
                    {profileData.firstName?.charAt(0) || currentPassengerInfo?.full_name?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerFileInput}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload from device
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerCameraInput}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take a photo
                </Button>
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-photo-input"
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-camera-input"
            />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Enter email address"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      
      {/* Settings Options */}
      <div className="space-y-3">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('notifications')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Manage your notification preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('privacy')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Privacy & Security</h3>
                <p className="text-sm text-gray-500">Account security settings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('preferences')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Preferences</h3>
                <p className="text-sm text-gray-500">Profile and account preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Passenger Profile Button - Added between Configure Notifications and Logout */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('editProfile')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Edit Passenger Profile</h3>
                <p className="text-sm text-gray-500">Update your personal information and photo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('help')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Help & Support</h3>
                <p className="text-sm text-gray-500">Get help and contact support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <Card>
        <CardContent className="p-4">
          <Button 
            onClick={handleLogout}
            variant="destructive" 
            className="w-full flex items-center gap-2"
          >
            <LogOut className="w-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
