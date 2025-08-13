import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useSession, signOut } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Booking } from "@/types/booking";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentsSection } from "@/components/dispatcher/PaymentsSection";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { MessagingContainer } from "@/components/messaging/MessagingContainer";

export default function DispatcherDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("bookings");
  const [data, setData] = useState<any[] | null>(null);
	const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session) {
      router.push("/auth/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          drivers (
            id,
            full_name,
            profile_photo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
      } else {
        setData(data);
      }
    };

    fetchData();
  }, []);

  const refetch = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        drivers (
          id,
          full_name,
          profile_photo_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
    } else {
      setData(data);
    }
  };

  if (!session) {
    return null;
  }

  const getSimpleStatus = (booking: any) => {
    if (booking.status === 'pending') {
      return 'booking_requested';
    } else if (booking.payment_status !== 'paid') {
      return 'payment_pending';
    } else if (booking.status === 'accepted' && booking.payment_status === 'paid') {
      return 'all_set';
    } else {
      return booking.status;
    }
  };

  const processedBookings: Booking[] = (data || []).map(booking => ({
    id: booking.id,
    pickup_location: booking.pickup_location,
    dropoff_location: booking.dropoff_location,
    pickup_time: booking.pickup_time,
    passenger_count: booking.passenger_count,
    vehicle_type: booking.vehicle_type,
    simple_status: getSimpleStatus(booking) as any,
    estimated_price: booking.estimated_price,
    final_negotiated_price: booking.final_price,
    final_price: booking.final_price,
    status: booking.status,
    payment_status: booking.payment_status,
    payment_confirmation_status: booking.payment_confirmation_status,
    driver_profiles: booking.drivers ? {
      id: booking.drivers.id,
      full_name: booking.drivers.full_name,
      profile_photo_url: booking.drivers.profile_photo_url
    } : undefined
  }));

  const renderContent = () => {
    switch (activeTab) {
      case "bookings":
        return (
          <div className="space-y-6">
            <DispatcherBookingManager 
              bookings={processedBookings}
              onBookingUpdate={refetch}
            />
          </div>
        );
      case "drivers":
        return <DriverManagement />;
      case "payments":
        return <PaymentsSection />;
      case "messages":
        return (
          <MessagingContainer
            userType="dispatcher"
            userId="dispatcher-1" // Replace with actual dispatcher ID
            currentUserName="Dispatcher"
          />
        );
      case "settings":
        return <DispatcherSettings />;
      default:
        return (
          <div className="space-y-6">
            <DispatcherBookingManager 
              bookings={processedBookings}
              onBookingUpdate={refetch}
            />
          </div>
        );
    }
  };

  return (
    <div className="container relative pb-20">
      <Tabs
        defaultValue="bookings"
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <div className="sticky top-0 z-20 border-b bg-background">
          <div className="container flex items-center justify-between py-4">
            <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Dispatcher Dashboard
            </h1>
            <TabsList>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="drivers">Drivers</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2 inline-block" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <Separator />
        {renderContent()}
      </Tabs>
    </div>
  );
}
