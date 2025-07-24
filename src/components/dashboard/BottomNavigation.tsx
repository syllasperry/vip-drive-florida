import { Car, Calendar, MessageCircle, CreditCard, Settings, DollarSign } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType: "passenger" | "driver";
}

export const BottomNavigation = ({ activeTab, onTabChange, userType }: BottomNavigationProps) => {
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

  const tabs = userType === "passenger" ? passengerTabs : driverTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 backdrop-blur-lg z-50">
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-300 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};