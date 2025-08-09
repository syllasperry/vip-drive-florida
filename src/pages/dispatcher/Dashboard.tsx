
import React, { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, UsersRound, MessagesSquare, Settings, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
            <DispatcherBookingList />
            <FinancialReports />
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
      case 'calculator':
        return <PaymentCalculator />;
      case 'settings':
        return <DispatcherSettings />;
      default:
        return <DispatcherBookingList />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Airbnb-inspired clean design */}
      <div className="sticky top-0 z-40 bg-card border-b border-border/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your rides and operations</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast({ title: "Dashboard refreshed!" })}
              className="hidden md:flex"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content with proper spacing for bottom navigation */}
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {renderActiveTab()}
        </div>
      </div>

      {/* Bottom Navigation Menu - Airbnb Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-5 gap-1 py-2">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                activeTab === "bookings" 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <ClipboardList className={`h-5 w-5 mb-1 ${activeTab === "bookings" ? "text-primary-foreground" : ""}`} />
              <span className="text-xs font-medium">Bookings</span>
            </button>
            
            <button
              onClick={() => setActiveTab("drivers")}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                activeTab === "drivers" 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <UsersRound className={`h-5 w-5 mb-1 ${activeTab === "drivers" ? "text-primary-foreground" : ""}`} />
              <span className="text-xs font-medium">Drivers</span>
            </button>
            
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                activeTab === "payments" 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <CalendarDays className={`h-5 w-5 mb-1 ${activeTab === "payments" ? "text-primary-foreground" : ""}`} />
              <span className="text-xs font-medium">Payments</span>
            </button>
            
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                activeTab === "messages" 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <MessagesSquare className={`h-5 w-5 mb-1 ${activeTab === "messages" ? "text-primary-foreground" : ""}`} />
              <span className="text-xs font-medium">Messages</span>
            </button>
            
            <button
              onClick={() => setActiveTab("calculator")}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                activeTab === "calculator" 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Calculator className={`h-5 w-5 mb-1 ${activeTab === "calculator" ? "text-primary-foreground" : ""}`} />
              <span className="text-xs font-medium">Calculator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
