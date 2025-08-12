
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentsSection } from "@/components/dispatcher/PaymentsSection";

export default function DispatcherDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');

  const renderContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <DispatcherBookingManager bookings={[]} onUpdate={() => {}} />;
      case 'drivers':
        return <DriverManagement drivers={[]} onDriverUpdate={() => {}} />;
      case 'payments':
        return <PaymentsSection />;
      case 'messages':
        return <DispatcherMessaging bookings={[]} />;
      case 'settings':
        return <DispatcherSettings bookings={[]} onUpdate={() => {}} />;
      default:
        return <DispatcherBookingManager bookings={[]} onUpdate={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4">
          <h1 className="text-2xl font-bold">VIP Dispatcher Dashboard</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul>
            <li className={`p-2 hover:bg-gray-700 cursor-pointer ${activeTab === 'bookings' ? 'bg-gray-700' : ''}`} onClick={() => setActiveTab('bookings')}>Bookings</li>
            <li className={`p-2 hover:bg-gray-700 cursor-pointer ${activeTab === 'drivers' ? 'bg-gray-700' : ''}`} onClick={() => setActiveTab('drivers')}>Drivers</li>
            <li className={`p-2 hover:bg-gray-700 cursor-pointer ${activeTab === 'payments' ? 'bg-gray-700' : ''}`} onClick={() => setActiveTab('payments')}>Payments</li>
            <li className={`p-2 hover:bg-gray-700 cursor-pointer ${activeTab === 'messages' ? 'bg-gray-700' : ''}`} onClick={() => setActiveTab('messages')}>Messages</li>
            <li className={`p-2 hover:bg-gray-700 cursor-pointer ${activeTab === 'settings' ? 'bg-gray-700' : ''}`} onClick={() => setActiveTab('settings')}>Settings</li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {renderContent()}
      </div>
    </div>
  );
}
