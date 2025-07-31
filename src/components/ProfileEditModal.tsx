import { useState, useEffect } from "react";
import { X, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentModal } from "@/components/ConsentModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: any;
  onPhotoUpload?: (file: File) => Promise<void>;
  onProfileUpdate?: () => void;
}

export const ProfileEditModal = ({ isOpen, onClose, userProfile, onPhotoUpload, onProfileUpdate }: ProfileEditModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePhoto: null as File | null,
    profilePhotoUrl: null as string | null,
    accountType: "",
    accountName: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoConsent = () => {
    setConsentModalOpen(true);
  };

  const handlePhotoConsentAgree = () => {
    setConsentModalOpen(false);
    document.getElementById("photo-upload")?.click();
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const handlePhotoFile = async (file: File) => {
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
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large", 
        description: "File size must be less than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Use the dashboard's photo upload handler if available
    if (onPhotoUpload) {
      setIsUploading(true);
      try {
        // Show optimistic update
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({
          ...prev,
          profilePhoto: file,
          profilePhotoUrl: previewUrl
        }));

        await onPhotoUpload(file);
        
        toast({
          title: "Photo uploaded!",
          description: "Your profile photo has been updated successfully.",
        });
        
      } catch (error) {
        console.error('Photo upload failed:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive"
        });
        
        // Revert optimistic update on error
        setFormData(prev => ({
          ...prev,
          profilePhoto: null,
          profilePhotoUrl: userProfile?.profile_photo_url || null
        }));
      } finally {
        setIsUploading(false);
      }
    } else {
      // Fallback to local state only
      setFormData(prev => ({
        ...prev,
        profilePhoto: file,
        profilePhotoUrl: URL.createObjectURL(file)
      }));
    }
  };

  // Load current user profile data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    console.log('ProfileEditModal: Loading profile data', userProfile);
    
    setFormData({
      name: userProfile?.full_name || "",
      email: userProfile?.email || "", 
      phone: userProfile?.phone || "",
      profilePhoto: null,
      profilePhotoUrl: userProfile?.profile_photo_url,
      accountType: userProfile?.account_type || "",
      accountName: userProfile?.account_name || ""
    });
  }, [isOpen, userProfile]);

  const handleSave = async () => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log('Saving profile data:', formData, 'for user:', userProfile.id);
      
      // Determine if this is a driver or passenger profile based on available fields
      const isDriver = userProfile.hasOwnProperty('car_make') || userProfile.hasOwnProperty('car_model');
      const tableName = isDriver ? 'drivers' : 'passengers';
      
      // Update profile in database
      const { error } = await supabase
        .from(tableName)
        .update({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          account_type: formData.accountType || null,
          account_name: formData.accountName || null
        })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Update failed",
          description: `Failed to save profile changes: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      // Success feedback
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });

      // Refresh parent component data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) {
    console.log("ProfileEditModal: Modal is closed, not rendering");
    return null;
  }
  
  console.log("ProfileEditModal: Modal is open, rendering modal");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Edit Profile</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-behavior-contain">
          <div className="p-6 space-y-6 pb-24">
            {/* Profile Photo */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                {isUploading ? (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : formData.profilePhotoUrl ? (
                  <img 
                    src={formData.profilePhotoUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full transition-opacity duration-300"
                    onError={() => {
                      setFormData(prev => ({ ...prev, profilePhotoUrl: null }));
                    }}
                  />
                ) : userProfile?.profile_photo_url ? (
                  <img 
                    src={userProfile.profile_photo_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full transition-opacity duration-300"
                    onError={() => {
                      setFormData(prev => ({ ...prev, profilePhotoUrl: null }));
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handlePhotoConsent}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>

                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-card-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-card-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-card-foreground">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="accountType" className="text-card-foreground">
                  Account Type
                </Label>
                <select
                  id="accountType"
                  value={formData.accountType}
                  onChange={(e) => handleInputChange("accountType", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select account type</option>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
                
                {/* Current Setting Display */}
                {userProfile?.account_type && userProfile?.account_name && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Current setting:</span>{" "}
                      <span className="capitalize">{userProfile.account_type}</span> — {userProfile.account_name}
                    </p>
                  </div>
                )}
              </div>

              {formData.accountType && (
                <div>
                  <Label htmlFor="accountName" className="text-card-foreground">
                    {formData.accountType === 'individual' ? 'Full Name' : 'Business Name'}
                  </Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange("accountName", e.target.value)}
                    className="mt-1"
                    placeholder={formData.accountType === 'individual' ? 'Enter your full name' : 'Enter business name'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex space-x-3 flex-shrink-0">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="flex-1" 
            disabled={isUploading}
          >
            {isUploading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Consent Modal */}
      <ConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onAgree={handlePhotoConsentAgree}
        title="Upload Photo"
        description="This app needs permission to access your device storage to upload your profile photo. Do you agree?"
      />
    </div>
  );
};