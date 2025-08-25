
import { Car, MessageCircle, CreditCard, Settings, DollarSign, Users } from "lucide-react";
import { Calendar } from "lucide-react";

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
    { id: "settings", label: "Profile", icon: Settings }
  ];

  const driverTabs = [
    { id: "rides", label: "Rides", icon: Car },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "settings", label: "Profile", icon: Settings }
  ];

  const dispatcherTabs = [
    { id: "bookings", label: "Bookings", icon: Car },
    { id: "drivers", label: "Drivers", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "settings", label: "Profile", icon: Settings }
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

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto">
        <div className={`grid h-16 ${finalTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {finalTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] relative transition-colors px-2 py-2 ${
                  isActive
                    ? "text-[#FF385C]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <div className="relative mb-1 flex items-center justify-center">
                  <Icon className={`h-6 w-6 ${isActive ? "text-[#FF385C]" : "text-gray-400"}`} />
                  {userType === "dispatcher" && tab.id === "bookings" && pendingActionsCount > 0 && (
                    <div className="absolute -top-1 -right-2 bg-[#FF385C] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingActionsCount > 9 ? '9+' : pendingActionsCount}
                    </div>
                  )}
                  {pendingActionsCount > 0 && tab.id === "messages" && (
                    <div className="absolute -top-1 -right-2 bg-[#FF385C] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingActionsCount > 9 ? '9+' : pendingActionsCount}
                    </div>
                  )}
                  {hasActiveRide && tab.id === "rides" && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-3 w-3" />
                  )}
                </div>
                <span className={`text-xs text-center leading-tight font-medium ${isActive ? "text-[#FF385C]" : "text-gray-400"}`}>
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
