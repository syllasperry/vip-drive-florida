import { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import { useSession, signOut } from "next-auth/react";
import { CalendarDays, Car, Home, ListChecks, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { Booking } from "@/types/booking";
import { getSimpleStatus } from "@/lib/utils";
import { HomeTab } from "@/components/passenger/HomeTab";
import { BookingsTab } from "@/components/passenger/BookingsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { supabase } from "@/integrations/supabase/client";
import { MessagingContainer } from "@/components/messaging/MessagingContainer";

export default function PassengerDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"home" | "bookings" | "messages" | "settings">("home");
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
      fetchProfile();
    }
  }, [session?.user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
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
        .eq('passenger_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
      } else {
        setData(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="h-screen bg-background">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-[200px]" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <div className="h-screen bg-background">Not authenticated.</div>;
  }

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

  const renderHome = () => (
    <HomeTab bookings={processedBookings} userId={session.user.id} />
  );

  const renderBookings = () => (
    <BookingsTab bookings={processedBookings} userId={session.user.id} />
  );

  const renderSettings = () => (
    <SettingsTab profile={profile} />
  );

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return renderHome();
      case "bookings":
        return renderBookings();
      case "messages":
        return (
          <MessagingContainer
            userType="passenger"
            userId={session?.user?.id || ''}
            currentUserName={profile?.full_name || 'Passenger'}
          />
        );
      case "settings":
        return renderSettings();
      default:
        return renderHome();
    }
  };

  return (
    <div className="h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.profile_photo_url || session?.user?.image || ""} alt={profile?.full_name || session?.user?.name || ""} />
                  <AvatarFallback>{profile?.full_name?.slice(0, 2).toUpperCase() || session?.user?.name?.slice(0, 2).toUpperCase() || "XX"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            className={`w-full rounded-full ${activeTab === "home" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : ""}`}
            onClick={() => setActiveTab("home")}
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button
            variant="outline"
            className={`w-full rounded-full ${activeTab === "bookings" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Bookings
          </Button>
          <Button
            variant="outline"
            className={`w-full rounded-full ${activeTab === "messages" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : ""}`}
            onClick={() => setActiveTab("messages")}
          >
            <Car className="mr-2 h-4 w-4" />
            Messages
          </Button>
          <Button
            variant="outline"
            className={`w-full rounded-full ${activeTab === "settings" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
