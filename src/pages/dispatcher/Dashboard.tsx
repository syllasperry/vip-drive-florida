
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { PaymentsSection } from "@/components/dispatcher/PaymentsSection";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { FinancialReports } from "@/components/dispatcher/FinancialReports";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { Users, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const DispatcherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    completionRate: 0
  });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkDispatcherAccess();
    loadDashboardData();
  }, []);

  const checkDispatcherAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      // Check if user is a dispatcher
      const { data: dispatcher, error } = await supabase
        .from('dispatchers')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !dispatcher) {
        toast({
          title: "Access Denied",
          description: "You don't have dispatcher privileges",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error checking dispatcher access:', error);
      navigate('/');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load basic stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, final_price, status')
        .limit(100);

      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active');

      setDrivers(driversData || []);
      setStats({
        totalBookings: bookings?.length || 0,
        totalRevenue: bookings?.reduce((sum, booking) => sum + (booking.final_price || 0), 0) || 0,
        activeDrivers: driversData?.length || 0,
        completionRate: 85 // Placeholder - calculate based on actual data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDriverUpdate = async () => {
    await loadDashboardData();
  };

  const mockDispatcherProfile = {
    full_name: 'Dispatcher Admin',
    profile_photo_url: null,
    phone: '+1 (555) 123-4567',
    email: 'dispatcher@vip-drive-florida.com'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <ProfileHeader 
          userType="passenger"
          userProfile={mockDispatcherProfile}
          onPhotoUpload={async (file: File) => {
            console.log('Photo upload for dispatcher:', file);
          }}
        />
        
        {/* Dashboard Content */}
        <div className="px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="drivers">Drivers</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="bookings" className="mt-0">
                <DispatcherBookingManager />
              </TabsContent>

              <TabsContent value="drivers" className="mt-0">
                <DriverManagement drivers={drivers} onDriverUpdate={onDriverUpdate} />
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                {/* Dashboard Stats - Only show in Payments tab */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.activeDrivers}</p>
                        </div>
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <PaymentsSection />
              </TabsContent>

              <TabsContent value="messages" className="mt-0">
                <DispatcherMessaging bookings={[]} />
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <FinancialReports />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <DispatcherSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
