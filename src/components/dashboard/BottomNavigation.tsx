
import { Car, Calendar, MessageCircle, CreditCard, Settings, DollarSign, AlertCircle, Navigation, Users, BarChart3 } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: "passenger" | "driver" | "dispatcher";
  pendingActionsCount?: number;
  hasActiveRide?: boolean;
}

export const BottomNavigation = ({ activeTab, onTabChange, userType, pendingActionsCount = 0, hasActiveRide = false }: BottomNavigationProps) => {
  const passengerTabs = [
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const driverTabs = [
    { id: "rides", label: "Rides", icon: Car },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const dispatcherTabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "rides", label: "Rides", icon: Car },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const getFinalTabs = () => {
    switch (userType) {
      case "passenger":
        return passengerTabs;
      case "driver":
        return driverTabs;
      case "dispatcher":
        return dispatcherTabs;
      default:
        return passengerTabs;
    }
  };

  const finalTabs = getFinalTabs();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border/50 backdrop-blur-lg z-50">
      <div className="grid max-w-lg mx-auto"
           style={{ gridTemplateColumns: `repeat(${finalTabs.length}, minmax(0, 1fr))` }}>
        {finalTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-300 relative ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative mb-1">
                <Icon className={`h-5 w-5 transition-all duration-200 ${isActive ? "scale-110" : ""}`} />
                {userType === "dispatcher" && tab.id === "rides" && pendingActionsCount > 0 && (
                  <div className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                    {pendingActionsCount > 9 ? '9+' : pendingActionsCount}
                  </div>
                )}
                {hasActiveRide && tab.id === "rides" && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-3 w-3 animate-pulse" />
                )}
              </div>
              <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
