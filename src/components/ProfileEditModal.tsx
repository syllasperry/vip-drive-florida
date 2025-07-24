import { useState, useEffect } from "react";
import { X, Upload, User, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentModal } from "@/components/ConsentModal";
import { CameraCapture } from "@/components/CameraCapture";
import { useToast } from "@/hooks/use-toast";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal = ({ isOpen, onClose }: ProfileEditModalProps) => {
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    profilePhoto: null as File | null,
    profilePhotoUrl: null as string | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentType, setConsentType] = useState<"upload" | "camera">("upload");
  const [cameraOpen, setCameraOpen] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoConsent = (type: "upload" | "camera") => {
    setConsentType(type);
    setConsentModalOpen(true);
  };

  const handlePhotoConsentAgree = () => {
    setConsentModalOpen(false);
    if (consentType === "upload") {
      document.getElementById("photo-upload")?.click();
    } else {
      setCameraOpen(true);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const handlePhotoFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (JPG, PNG)",
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
    
    // Upload to Supabase immediately
    await uploadPhotoToSupabase(file);
  };

  const uploadPhotoToSupabase = async (file: File) => {
    setIsUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error(uploadError);
        toast({
          title: "Upload failed",
          description: "Failed to upload profile photo",
          variant: "destructive",
        });
        return;
      }

      const { data: publicURLData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicURL = publicURLData?.publicUrl;

      const { error: updateError } = await supabase
        .from("passengers")
        .update({ profile_photo_url: publicURL })
        .eq("id", session.user.id);

      if (updateError) {
        console.error(updateError);
        toast({
          title: "Update failed",
          description: "Failed to update profile photo",
          variant: "destructive",
        });
      } else {
        // Update local form data with the uploaded file
        setFormData(prev => ({
          ...prev,
          profilePhoto: file,
          profilePhotoUrl: publicURL
        }));

        toast({
          title: "Photo updated!",
          description: "Your profile photo has been successfully uploaded.",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Load current user profile data when modal opens
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isOpen) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: passenger } = await supabase
        .from("passengers")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (passenger) {
        setFormData({
          name: passenger.full_name || "John Doe",
          email: passenger.email || "john@example.com",
          phone: passenger.phone || "+1 (555) 123-4567",
          profilePhoto: null,
          profilePhotoUrl: passenger.profile_photo_url
        });
      }
    };

    loadUserProfile();
  }, [isOpen]);

  const handleSave = () => {
    // Save logic here
    console.log("Saving profile:", formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Edit Profile</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              {isUploading ? (
                <div className="w-full h-full rounded-full bg-muted animate-pulse flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : formData.profilePhotoUrl ? (
                <img 
                  src={formData.profilePhotoUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : formData.profilePhoto ? (
                <img 
                  src={URL.createObjectURL(formData.profilePhoto)} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePhotoConsent("upload")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePhotoConsent("camera")}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </div>

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
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex space-x-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="luxury" className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Consent Modal */}
      <ConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onAgree={handlePhotoConsentAgree}
        title={consentType === "upload" ? "Upload Photo" : "Camera Access"}
        description={
          consentType === "upload"
            ? "By uploading your photo, you consent to us using it for your profile display within the app. Do you agree?"
            : "This app needs permission to access your camera to take your profile photo. Do you agree?"
        }
      />

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handlePhotoFile}
      />
    </div>
  );
};