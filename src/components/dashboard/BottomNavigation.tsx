import { Car, Calendar, MessageCircle, CreditCard, Settings, DollarSign, Users } from "lucide-react";

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
    { id: "bookings", label: "Bookings", icon: Car },
    { id: "drivers", label: "Drivers", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-5 h-16">
          {finalTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center h-full relative transition-colors ${
                  isActive
                    ? "text-red-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="relative mb-1">
                  <Icon className={`h-5 w-5 ${isActive ? "text-red-500" : "text-gray-500"}`} />
                  {userType === "dispatcher" && tab.id === "bookings" && pendingActionsCount > 0 && (
                    <div className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingActionsCount > 9 ? '9+' : pendingActionsCount}
                    </div>
                  )}
                  {hasActiveRide && tab.id === "rides" && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-3 w-3" />
                  )}
                </div>
                <span className={`text-xs ${isActive ? "text-red-500 font-medium" : "text-gray-500"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
