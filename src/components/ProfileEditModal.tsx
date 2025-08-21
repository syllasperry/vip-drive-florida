
import { useState, useEffect } from "react";
import { X, Camera, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { saveMyPassengerProfile, fetchMyPassengerProfile, type PassengerProfile } from "@/lib/passenger/profile";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: any;
  onPhotoUpload?: (file: File) => Promise<void>;
  onProfileUpdate?: () => void;
}

export const ProfileEditModal = ({ isOpen, onClose, userProfile, onPhotoUpload, onProfileUpdate }: ProfileEditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<PassengerProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: null as string | null
  });
  const { toast } = useToast();

  // Load profile data on mount
  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      const profileData = await fetchMyPassengerProfile();
      if (profileData) {
        setProfile(profileData);
        setFormData({
          fullName: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          avatarUrl: profileData.profile_photo_url
        });
      } else {
        // Fallback to userProfile if no passenger profile exists
        setFormData({
          fullName: userProfile?.full_name || '',
          email: userProfile?.email || '',
          phone: userProfile?.phone || '',
          avatarUrl: userProfile?.profile_photo_url || null
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const savedProfile = await saveMyPassengerProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        avatarUrl: formData.avatarUrl
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Update local state with saved data
      if (savedProfile) {
        setProfile(savedProfile);
        setFormData({
          fullName: savedProfile.full_name || '',
          email: savedProfile.email || '',
          phone: savedProfile.phone || '',
          avatarUrl: savedProfile.profile_photo_url
        });
      }

      onProfileUpdate?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onPhotoUpload) {
      try {
        setLoading(true);
        await onPhotoUpload(file);
        // Create a temporary URL for preview
        const tempUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, avatarUrl: tempUrl }));
        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload photo",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Edit Profile</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={formData.avatarUrl || undefined} 
                  alt="Profile"
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2 cursor-pointer transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="flex items-center space-x-2 text-card-foreground">
                <User className="h-4 w-4" />
                <span>Full Name</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center space-x-2 text-card-foreground">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                className="mt-1"
                disabled
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center space-x-2 text-card-foreground">
                <Phone className="h-4 w-4" />
                <span>Phone</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
