import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, MessageCircle, CreditCard, Settings, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bookings");

  const handleNewBooking = () => {
    navigate("/passenger/price-estimate");
  };

  const handleLogout = () => {
    navigate("/");
  };

  const mockBookings = [
    {
      id: "1",
      date: "2024-01-15",
      time: "14:30",
      from: "Miami International Airport",
      to: "Brickell City Centre",
      vehicle: "Tesla Model Y",
      status: "confirmed",
      driver: "John Smith"
    },
    {
      id: "2", 
      date: "2024-01-18",
      time: "09:00",
      from: "Fort Lauderdale Airport",
      to: "Las Olas Boulevard",
      vehicle: "BMW Sedan",
      status: "pending",
      driver: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-card rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Welcome back!</h1>
              <p className="text-muted-foreground">Manage your rides and bookings</p>
            </div>
            <Button onClick={handleNewBooking} variant="luxury" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Booking</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-xl mb-6 shadow-lg overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { id: "bookings", label: "My Bookings", icon: Calendar },
              { id: "profile", label: "Profile", icon: User },
              { id: "messages", label: "Messages", icon: MessageCircle },
              { id: "payment", label: "Payment", icon: CreditCard },
              { id: "settings", label: "Settings", icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-card-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card rounded-xl p-6 shadow-lg">
          {activeTab === "bookings" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">My Bookings</h2>
              <div className="space-y-4">
                {mockBookings.map(booking => (
                  <div key={booking.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="ml-2 text-card-foreground">{booking.from}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">To:</span>
                        <span className="ml-2 text-card-foreground">{booking.to}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="ml-2 text-card-foreground">{booking.vehicle}</span>
                      </div>
                      {booking.driver && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Driver:</span>
                          <span className="ml-2 text-card-foreground">{booking.driver}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {mockBookings.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings yet</p>
                    <Button onClick={handleNewBooking} variant="outline" className="mt-4">
                      Make Your First Booking
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Name</label>
                    <input 
                      type="text" 
                      defaultValue="John Doe" 
                      className="w-full p-2 border border-border rounded-lg bg-background"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Email</label>
                    <input 
                      type="email" 
                      defaultValue="john@example.com" 
                      className="w-full p-2 border border-border rounded-lg bg-background"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-card-foreground mb-1">Phone</label>
                    <input 
                      type="tel" 
                      defaultValue="+1 (555) 123-4567" 
                      className="w-full p-2 border border-border rounded-lg bg-background"
                      disabled
                    />
                  </div>
                </div>
                <Button variant="outline">Edit Profile</Button>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Messages</h2>
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Messages with your drivers will appear here
                </p>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Payment Information</h2>
              <div className="space-y-4">
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="font-semibold text-card-foreground mb-2">Payment Methods</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment is made directly to your driver. We accept all major credit cards, 
                    Apple Pay, Google Pay, Venmo, Zelle, and cash.
                  </p>
                </div>
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="font-semibold text-card-foreground mb-2">Payment Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment must be completed within 24 hours of driver acceptance to secure your booking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium text-card-foreground">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium text-card-foreground">Privacy</h3>
                    <p className="text-sm text-muted-foreground">Control your privacy settings</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button 
                    onClick={handleLogout}
                    variant="destructive" 
                    className="flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;