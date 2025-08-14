
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
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Calendar, TrendingUp, LogOut } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkDispatcherAccess();
    loadDashboardStats();
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

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load basic stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, final_price, status')
        .limit(100);

      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, status')
        .eq('status', 'active');

      setStats({
        totalBookings: bookings?.length || 0,
        totalRevenue: bookings?.reduce((sum, booking) => sum + (booking.final_price || 0), 0) || 0,
        activeDrivers: drivers?.length || 0,
        completionRate: 85 // Placeholder - calculate based on actual data
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">VIP Dispatcher Dashboard</h1>
          <Button 
            onClick={handleLogout}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        
        {/* Dashboard Stats */}
        <div className="px-6 py-4">
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

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'bookings' && <DispatcherBookingManager />}
            {activeTab === 'drivers' && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">Driver management coming soon</div>
                </CardContent>
              </Card>
            )}
            {activeTab === 'payments' && <PaymentsSection />}
            {activeTab === 'messages' && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">Messages coming soon</div>
                </CardContent>
              </Card>
            )}
            {activeTab === 'reports' && <FinancialReports />}
            {activeTab === 'settings' && <DispatcherSettings />}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="dispatcher"
        pendingActionsCount={0}
      />
    </div>
  );
};

export default DispatcherDashboard;
