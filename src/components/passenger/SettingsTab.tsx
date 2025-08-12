import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, LogOut, Bell, Shield, HelpCircle, Camera } from "lucide-react";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { PrivacySecurityCard } from "./PrivacySecurityCard";
import { HelpSupportCard } from "./HelpSupportCard";
import { getMyPassengerPreferences, type PassengerPreferences } from "@/lib/api/passengerPreferences";

interface SettingsTabProps {
  passengerInfo: any;
}

export const SettingsTab = ({ passengerInfo }: SettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [activeModal, setActiveModal] = useState<'notifications' | 'privacy' | 'help' | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prefs, setPrefs] = useState<PassengerPreferences | null>(null);

  useEffect(() => {
    if (passengerInfo) {
      setFormData({
        full_name: passengerInfo.full_name || '',
        phone: passengerInfo.phone || '',
        email: passengerInfo.email || ''
      });
    }
  }, [passengerInfo]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences = await getMyPassengerPreferences();
        console.log('Loaded passenger preferences:', preferences);
        setPrefs(preferences);
      } catch (error) {
        console.error('Failed to load passenger preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile || !passengerInfo?.id) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${passengerInfo.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, photoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let photoUrl = passengerInfo?.profile_photo_url;

      // Upload photo if a new one was selected
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const updateData: any = {
        ...formData
      };

      if (photoUrl) {
        updateData.profile_photo_url = photoUrl;
      }

      const { error } = await supabase
        .from('passengers')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
          userId={passengerInfo?.id} 
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={photoPreview || passengerInfo?.profile_photo_url} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {passengerInfo?.full_name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer"
                     onClick={() => document.getElementById('photo-upload')?.click()}>
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            {!editing && (
              <div>
                <h3 className="font-medium text-gray-900">{passengerInfo?.full_name || 'Unknown'}</h3>
                <p className="text-sm text-gray-500">{passengerInfo?.email || 'No email'}</p>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
            id="photo-upload"
          />

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {photoFile && (
                <div className="text-sm text-gray-600">
                  New photo selected: {photoFile.name}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  className="flex-1"
                  disabled={isUploading}
                >
                  {isUploading ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditing(false);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }} 
                  className="flex-1"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{passengerInfo?.phone || 'No phone number'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{passengerInfo?.email || 'No email'}</span>
              </div>
              <Button onClick={() => setEditing(true)} variant="outline" className="w-full">
                Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
