import { useState, useEffect } from "react";
import { X, Upload, User, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentModal } from "@/components/ConsentModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DriverPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: any;
  onPhotoUpload?: (file: File) => Promise<void>;
  onProfileUpdate?: () => void;
}

export const DriverPreferencesModal = ({ 
  isOpen, 
  onClose, 
  userProfile, 
  onPhotoUpload, 
  onProfileUpdate 
}: DriverPreferencesModalProps) => {
  const [formData, setFormData] = useState({
    // Driver Information
    name: "",
    email: "",
    phone: "",
    profilePhoto: null as File | null,
    profilePhotoUrl: null as string | null,
    // Vehicle Information
    carMake: "",
    carModel: "",
    carYear: "",
    carColor: "",
    licensePlate: ""
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
    document.getElementById("driver-photo-upload")?.click();
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

    console.log('DriverPreferencesModal: Loading profile data', userProfile);
    
    // Parse car_type back into individual fields
    let carMake = "", carModel = "", carYear = "", carColor = "";
    if (userProfile?.car_type) {
      const carTypeParts = userProfile.car_type.split(' ');
      if (carTypeParts.length >= 3) {
        carYear = carTypeParts[0] || "";
        carMake = carTypeParts[1] || "";
        carModel = carTypeParts.slice(2).join(' ') || "";
      }
    }
    
    setFormData({
      // Driver Information
      name: userProfile?.full_name || "",
      email: userProfile?.email || "", 
      phone: userProfile?.phone || "",
      profilePhoto: null,
      profilePhotoUrl: userProfile?.profile_photo_url,
      // Vehicle Information
      carMake,
      carModel,
      carYear,
      carColor, // Note: color is not stored separately in current schema
      licensePlate: userProfile?.license_plate || ""
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
      console.log('Saving driver preferences:', formData, 'for user:', userProfile.id);
      
      // Update driver profile in database
      const { error } = await supabase
        .from('drivers')
        .update({
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          car_type: `${formData.carYear} ${formData.carMake} ${formData.carModel}`.trim(),
          license_plate: formData.licensePlate
        })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error updating driver preferences:', error);
        toast({
          title: "Update failed",
          description: `Failed to save preferences: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      // Success feedback
      toast({
        title: "Preferences updated!",
        description: "Your driver preferences have been successfully updated.",
      });

      // Refresh parent component data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving driver preferences:', error);
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
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Driver Preferences</h2>
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
                  id="driver-photo-upload"
                />
              </div>
            </div>

            {/* Driver Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-card-foreground">Driver Information</h3>
              </div>
              
              <div>
                <Label htmlFor="driver-name" className="text-card-foreground">
                  Full Name
                </Label>
                <Input
                  id="driver-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="driver-email" className="text-card-foreground">
                  Email Address
                </Label>
                <Input
                  id="driver-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="driver-phone" className="text-card-foreground">
                  Phone Number
                </Label>
                <Input
                  id="driver-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Car className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-card-foreground">Vehicle Information</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="car-make" className="text-card-foreground">
                    Car Make
                  </Label>
                  <Input
                    id="car-make"
                    value={formData.carMake}
                    onChange={(e) => handleInputChange("carMake", e.target.value)}
                    placeholder="e.g. Toyota"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="car-model" className="text-card-foreground">
                    Car Model
                  </Label>
                  <Input
                    id="car-model"
                    value={formData.carModel}
                    onChange={(e) => handleInputChange("carModel", e.target.value)}
                    placeholder="e.g. Camry"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="car-year" className="text-card-foreground">
                    Car Year
                  </Label>
                  <Input
                    id="car-year"
                    value={formData.carYear}
                    onChange={(e) => handleInputChange("carYear", e.target.value)}
                    placeholder="e.g. 2020"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="car-color" className="text-card-foreground">
                    Car Color
                  </Label>
                  <Input
                    id="car-color"
                    value={formData.carColor}
                    onChange={(e) => handleInputChange("carColor", e.target.value)}
                    placeholder="e.g. Silver"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="license-plate" className="text-card-foreground">
                  License Plate (Optional)
                </Label>
                <Input
                  id="license-plate"
                  value={formData.licensePlate}
                  onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                  placeholder="e.g. ABC123"
                  className="mt-1"
                />
              </div>
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