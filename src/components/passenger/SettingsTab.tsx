
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, LogOut, Bell, Shield, HelpCircle } from "lucide-react";

interface SettingsTabProps {
  passengerInfo: any;
}

export const SettingsTab = ({ passengerInfo }: SettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (passengerInfo) {
      setFormData({
        full_name: passengerInfo.full_name || '',
        phone: passengerInfo.phone || '',
        email: passengerInfo.email || ''
      });
    }
  }, [passengerInfo]);

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('passengers')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
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
            <Avatar className="h-16 w-16">
              <AvatarImage src={passengerInfo?.profile_photo_url} />
              <AvatarFallback className="bg-gray-200 text-gray-600">
                {passengerInfo?.full_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            {!editing && (
              <div>
                <h3 className="font-medium text-gray-900">{passengerInfo?.full_name || 'Unknown'}</h3>
                <p className="text-sm text-gray-500">{passengerInfo?.email || 'No email'}</p>
              </div>
            )}
          </div>

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
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">Save Changes</Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
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
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
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

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
