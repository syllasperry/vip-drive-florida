import { Car, Calendar, MessageCircle, CreditCard, Settings, DollarSign, AlertCircle, Navigation } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: "passenger" | "driver";
  pendingActionsCount?: number;
  hasActiveRide?: boolean;
}

export const BottomNavigation = ({ activeTab, onTabChange, userType, pendingActionsCount = 0, hasActiveRide = false }: BottomNavigationProps) => {
  const passengerTabs = [
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "todo", label: "To-Do", icon: AlertCircle, badge: pendingActionsCount },
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

  const finalTabs = userType === "passenger" ? passengerTabs : driverTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 backdrop-blur-lg z-50">
      <div className={`grid grid-cols-${finalTabs.length} max-w-lg mx-auto`}>
        {finalTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-4 px-3 transition-all duration-300 relative ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 mb-2 transition-transform ${isActive ? "scale-110" : ""}`} />
                {userType === "passenger" && 'badge' in tab && typeof (tab as any).badge === 'number' && (tab as any).badge > 0 && (
                  <div className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {(tab as any).badge > 9 ? '9+' : (tab as any).badge}
                  </div>
                )}
              </div>
              <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};