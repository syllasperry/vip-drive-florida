
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Calendar, Shield, Bell, Globe } from "lucide-react";

export const DispatcherSettings = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">Loading settings...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your dispatcher account settings</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold">VIP Dispatcher</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Member since {new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Account Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Account Type</h4>
              <p className="text-sm text-muted-foreground">VIP Dispatcher Account</p>
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Security</h4>
              <p className="text-sm text-muted-foreground">Manage password and security settings</p>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">New Bookings</h4>
              <p className="text-sm text-muted-foreground">Get notified when new bookings arrive</p>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Driver Updates</h4>
              <p className="text-sm text-muted-foreground">Updates from drivers about ride status</p>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Payment Notifications</h4>
              <p className="text-sm text-muted-foreground">Payment confirmations and updates</p>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>System Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto-refresh</h4>
              <p className="text-sm text-muted-foreground">Automatically refresh dashboard every 10 seconds</p>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">Live updates from Supabase</p>
            </div>
            <Button variant="outline" size="sm">
              Active
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Data Sync</h4>
              <p className="text-sm text-muted-foreground">Synchronization with database</p>
            </div>
            <Button variant="outline" size="sm">
              Connected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Need help with the dispatcher dashboard? Contact our support team.
          </p>
          <div className="flex space-x-3">
            <Button variant="outline">
              Contact Support
            </Button>
            <Button variant="outline">
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
