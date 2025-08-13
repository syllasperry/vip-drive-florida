
import { useState, useEffect } from "react";
import { X, User, Upload, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMyPassengerProfile, upsertMyPassengerProfile, buildAvatarUrl } from "@/lib/api/profiles";

interface PassengerProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PassengerProfile | null;
  onProfileUpdate: (profile: PassengerProfile) => void;
}

export const ProfileSettingsModal = ({ 
  isOpen, 
  onClose, 
  profile: initialProfile,
  onProfileUpdate
}: ProfileSettingsModalProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen && initialProfile) {
      setFormData({
        first_name: initialProfile.first_name || '',
        last_name: initialProfile.last_name || '',
        phone: initialProfile.phone || '',
        email: initialProfile.email || ''
      });
      
      // Try to load existing avatar
      loadExistingAvatar(initialProfile.id);
    }
  }, [isOpen, initialProfile]);

  const loadExistingAvatar = async (userId: string) => {
    try {
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(userId, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
      
      if (files && files.length > 0) {
        const avatarUrl = buildAvatarUrl(userId, files[0].name);
        setAvatarUrl(avatarUrl);
      }
    } catch (error) {
      console.error('Error loading existing avatar:', error);
    }
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

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    return buildAvatarUrl(userId, fileName);
  };

  const handleSave = async () => {
    if (!initialProfile?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      let newAvatarUrl = avatarUrl;

      // Upload avatar if a new one was selected
      if (avatarFile) {
        setIsUploading(true);
        try {
          newAvatarUrl = await uploadAvatar(avatarFile, initialProfile.id);
          if (newAvatarUrl) {
            setAvatarUrl(newAvatarUrl);
          }
        } catch (error) {
          console.error('Avatar upload failed:', error);
          toast({
            title: "Photo upload failed",
            description: "Failed to upload photo. Saving other changes.",
            variant: "destructive"
          });
        } finally {
          setIsUploading(false);
        }
      }

      // Update profile data
      await upsertMyPassengerProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim()
      });

      // Create updated profile object
      const updatedProfile: PassengerProfile = {
        ...initialProfile,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim()
      };

      // Clear file selection
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Notify parent and close
      onProfileUpdate(updatedProfile);
      onClose();

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

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
    if (initialProfile) {
      setFormData({
        first_name: initialProfile.first_name || '',
        last_name: initialProfile.last_name || '',
        phone: initialProfile.phone || '',
        email: initialProfile.email || ''
      });
    }

    // Clear file selection
    setAvatarFile(null);
    setAvatarPreview(null);
    onClose();
  };

  const triggerFileInput = () => {
    document.getElementById('profile-photo-input')?.click();
  };

  const triggerCameraInput = () => {
    document.getElementById('profile-camera-input')?.click();
  };

  const getDisplayAvatar = () => {
    if (avatarPreview) return avatarPreview;
    if (avatarUrl) return avatarUrl;
    return null;
  };

  const getInitials = () => {
    const firstName = formData.first_name || initialProfile?.first_name || '';
    const lastName = formData.last_name || initialProfile?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'P';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md max-h-[90vh] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">
              Profile Settings
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-behavior-contain p-6">
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={getDisplayAvatar() || undefined} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-lg">
                    {getInitials()}
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
                  Upload Photo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerCameraInput}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
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
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
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
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="flex-1"
              aria-disabled={isSaving || isUploading}
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
      </div>
    </div>
  );
};
