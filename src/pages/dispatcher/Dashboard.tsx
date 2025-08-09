
import React, { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, UsersRound, MessagesSquare, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { FinancialReports } from "@/components/dispatcher/FinancialReports";
import { PaymentCalculator } from "@/components/dispatcher/PaymentCalculator";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bookings");

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Auto-refresh functionality for real-time updates
    }, 10000); // Every 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="space-y-6">
            {/* Enhanced Booking List Manager */}
            <DispatcherBookingList />
            
            {/* Financial Reports */}
            <FinancialReports />
            
            {/* Smart Pricing Calculator */}
            <PaymentCalculator />
          </div>
        );
      case 'drivers':
        return <DriverManagement />;
      case 'payments':
        return (
          <div className="space-y-6">
            <FinancialReports />
            <PaymentCalculator />
          </div>
        );
      case 'messages':
        return <DispatcherMessaging />;
      case 'settings':
        return <DispatcherSettings />;
      default:
        return <DispatcherBookingList />;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dispatcher Dashboard</h1>
        <Button onClick={() => toast({ title: "Dashboard atualizado!" })}>
          Test Toast
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <TabsList>
            <TabsTrigger value="bookings">
              <ClipboardList className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="drivers">
              <UsersRound className="h-4 w-4 mr-2" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CalendarDays className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessagesSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="grid grid-cols-5 gap-1 p-2">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "bookings" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs">Bookings</span>
            </button>
            
            <button
              onClick={() => setActiveTab("drivers")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "drivers" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UsersRound className="h-5 w-5" />
              <span className="text-xs">Drivers</span>
            </button>
            
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "payments" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs">Payments</span>
            </button>
            
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "messages" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessagesSquare className="h-5 w-5" />
              <span className="text-xs">Messages</span>
            </button>
            
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeTab === "settings" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="pb-20 md:pb-0">
          <TabsContent value="bookings" className="space-y-4 mt-0">
            {renderActiveTab()}
          </TabsContent>
          <TabsContent value="drivers" className="space-y-4 mt-0">
            {renderActiveTab()}
          </TabsContent>
          <TabsContent value="payments" className="space-y-4 mt-0">
            {renderActiveTab()}
          </TabsContent>
          <TabsContent value="messages" className="space-y-4 mt-0">
            {renderActiveTab()}
          </TabsContent>
          <TabsContent value="settings" className="space-y-4 mt-0">
            {renderActiveTab()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
