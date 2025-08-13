
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Camera, Upload, Save, Loader2 } from "lucide-react";

interface ProfileSettingsCardProps {
  passengerInfo: any;
  onProfileUpdate?: () => void;
}

export const ProfileSettingsCard = ({ passengerInfo, onProfileUpdate }: ProfileSettingsCardProps) => {
  const { toast } = useToast();
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

  // Load profile data when component mounts or passengerInfo changes
  useEffect(() => {
    if (passengerInfo) {
      // Split full_name into first and last name
      const nameParts = passengerInfo.full_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfileData({
        firstName,
        lastName,
        phone: passengerInfo.phone || '',
        email: passengerInfo.email || '',
        profilePhotoUrl: passengerInfo.profile_photo_url || ''
      });
    }
  }, [passengerInfo]);

  // Get the best available photo URL with fallbacks
  const getPhotoUrl = () => {
    if (previewUrl) return previewUrl;
    if (profileData.profilePhotoUrl) return profileData.profilePhotoUrl;
    if (passengerInfo?.profile_photo_url) return passengerInfo.profile_photo_url;
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
    if (!passengerInfo?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${passengerInfo.id}.${fileExt}`;
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
    if (!passengerInfo?.id) {
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
        full_name: fullName || passengerInfo.full_name,
        phone: profileData.phone.trim() || null,
        email: profileData.email.trim() || passengerInfo.email
      };

      if (photoUrl) {
        updateData.profile_photo_url = photoUrl;
      }

      // Update passenger profile
      const { error } = await supabase
        .from('passengers')
        .update(updateData)
        .eq('id', passengerInfo.id);

      if (error) throw error;

      // Update local state
      setProfileData(prev => ({
        ...prev,
        profilePhotoUrl: photoUrl || prev.profilePhotoUrl
      }));

      // Clear file selection
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      // Notify parent component to refresh data
      if (onProfileUpdate) {
        onProfileUpdate();
      }

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
    if (passengerInfo) {
      const nameParts = passengerInfo.full_name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setProfileData({
        firstName,
        lastName,
        phone: passengerInfo.phone || '',
        email: passengerInfo.email || '',
        profilePhotoUrl: passengerInfo.profile_photo_url || ''
      });
    }

    // Clear file selection
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  };

  const triggerFileInput = () => {
    document.getElementById('profile-photo-input')?.click();
  };

  const triggerCameraInput = () => {
    document.getElementById('profile-camera-input')?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getPhotoUrl() || undefined} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-lg">
                {profileData.firstName?.charAt(0) || passengerInfo?.full_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {isEditing && (
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
          )}
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
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={isSaving}
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
              />
            </div>

            <div className="flex gap-2">
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
                    Save Changes
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
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-gray-600">Name</Label>
              <p className="font-medium">
                {passengerInfo?.full_name || 'Not set'}
              </p>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Phone</Label>
              <p className="font-medium">
                {passengerInfo?.phone || 'Not set'}
              </p>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Email</Label>
              <p className="font-medium">
                {passengerInfo?.email || 'Not set'}
              </p>
            </div>

            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline" 
              className="w-full"
            >
              Edit Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
