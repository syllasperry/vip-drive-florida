import { useState } from "react";
import { X, Upload, User, Camera } from "lucide-react";
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
    profilePhoto: null as File | null
  });
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

  const handlePhotoFile = (file: File) => {
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
    
    setFormData(prev => ({
      ...prev,
      profilePhoto: file
    }));
  };

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
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              {formData.profilePhoto ? (
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