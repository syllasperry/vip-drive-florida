import React, { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, UsersRound, MessagesSquare, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { FinancialReports } from "@/components/dispatcher/FinancialReports";
import { PaymentCalculator } from "@/components/dispatcher/PaymentCalculator";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";

import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bookings");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // For demonstration purposes, we're just updating the time
      // In a real application, you might fetch new data here
    }, 10000); // Every 10 seconds

    return () => clearInterval(intervalId); // Clear interval on unmount
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="space-y-6">
            {/* Enhanced Booking Manager */}
            <DispatcherBookingManager />
            
            {/* Auto-refresh indicator */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Última atualização: {new Date().toLocaleTimeString()}</span>
              <span>Auto-refresh ativo (10s)</span>
            </div>

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
        return <DispatcherBookingManager />;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dispatcher Dashboard</h1>
        <Button onClick={() => toast({ title: "Teste de Toast!" })}>
          Test Toast
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
        <TabsContent value="bookings" className="space-y-4">
          {renderActiveTab()}
        </TabsContent>
        <TabsContent value="drivers" className="space-y-4">
          {renderActiveTab()}
        </TabsContent>
        <TabsContent value="payments" className="space-y-4">
          {renderActiveTab()}
        </TabsContent>
        <TabsContent value="messages" className="space-y-4">
          {renderActiveTab()}
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          {renderActiveTab()}
        </TabsContent>
      </Tabs>

      {/* Booking Details Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Booking Details</DrawerTitle>
            <DrawerDescription>
              Detailed information about the selected booking.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            {selectedBooking ? (
              <>
                <p>Booking ID: {selectedBooking.id}</p>
                {/* Display other booking details here */}
              </>
            ) : (
              <p>No booking selected.</p>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
