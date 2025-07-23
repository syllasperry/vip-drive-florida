import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Calendar, MessageCircle, DollarSign, Settings, LogOut, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessagingInterface } from "@/components/MessagingInterface";
import { DriverScheduleModal } from "@/components/DriverScheduleModal";
import { DriverSettingsModal } from "@/components/DriverSettingsModal";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("rides");
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"notifications" | "privacy" | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = () => {
    navigate("/");
  };

  const handleAcceptRide = (rideId: string) => {
    setMockRides(prevRides => 
      prevRides.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: "waiting_payment", countdown: 24 }
          : ride
      )
    );
  };

  const handleDeclineRide = (rideId: string) => {
    setMockRides(prevRides => 
      prevRides.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: "declined" }
          : ride
      )
    );
  };

  const handleOpenSettings = (type: "notifications" | "privacy") => {
    setSettingsType(type);
    setSettingsOpen(true);
  };

  const [mockRides, setMockRides] = useState([
    {
      id: "1",
      date: "2024-01-15",
      time: "14:30",
      from: "Miami International Airport",
      to: "Brickell City Centre",
      passenger: "Sarah Johnson",
      status: "confirmed",
      payment: "$85.00",
      paymentMethod: "Visa ending in 4532",
      countdown: null
    },
    {
      id: "2", 
      date: "2024-01-18",
      time: "09:00",
      from: "Fort Lauderdale Airport", 
      to: "Las Olas Boulevard",
      passenger: "Mike Chen",
      status: "payment_confirmed",
      payment: "$95.00",
      paymentMethod: "Zelle",
      countdown: 18 // hours remaining
    },
    {
      id: "3",
      date: "2024-01-20",
      time: "16:00",
      from: "Palm Beach Airport",
      to: "Worth Avenue",
      passenger: "Emma Davis",
      status: "pending",
      payment: "$120.00",
      paymentMethod: null,
      countdown: null
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "waiting_payment": return "bg-orange-100 text-orange-800";
      case "payment_confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmed";
      case "pending": return "Pending";
      case "waiting_payment": return "Waiting for Payment";
      case "payment_confirmed": return "Payment Confirmed";
      case "completed": return "Completed";
      default: return status;
    }
  };

  const handleConfirmPaymentReceived = (rideId: string) => {
    setMockRides(prevRides => 
      prevRides.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: "confirmed" }
          : ride
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-card rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Driver Dashboard</h1>
              <p className="text-muted-foreground">Manage your rides and earnings</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Online
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card rounded-xl mb-6 shadow-lg overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { id: "rides", label: "My Rides", icon: Car },
              { id: "earnings", label: "Earnings", icon: DollarSign },
              { id: "messages", label: "Messages", icon: MessageCircle },
              { id: "schedule", label: "Schedule", icon: Calendar },
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
          {activeTab === "rides" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">My Rides</h2>
              <div className="space-y-4">
                {mockRides.map(ride => (
                  <div key={ride.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                          {getStatusText(ride.status)}
                        </span>
                        {ride.status === "waiting_payment" && ride.countdown && (
                          <div className="flex items-center space-x-1 text-orange-600">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs font-medium">{ride.countdown}h left</span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {new Date(ride.date).toLocaleDateString()} at {ride.time}
                        </span>
                      </div>
                      <span className="font-semibold text-primary">{ride.payment}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Passenger:</span>
                        <span className="ml-2 text-card-foreground">{ride.passenger}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="ml-2 text-card-foreground">{ride.from}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">To:</span>
                        <span className="ml-2 text-card-foreground">{ride.to}</span>
                      </div>
                      {ride.paymentMethod && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Payment:</span>
                          <span className="ml-2 text-card-foreground">{ride.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                    {ride.status === "pending" && (
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="luxury"
                          onClick={() => handleAcceptRide(ride.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeclineRide(ride.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                    {ride.status === "waiting_payment" && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800 mb-2">
                          Passenger needs to complete payment within 24 hours.
                        </p>
                        <Button 
                          size="sm" 
                          variant="luxury" 
                          className="flex items-center space-x-2"
                          onClick={() => handleConfirmPaymentReceived(ride.id)}
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Confirm Payment Received</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "earnings" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Earnings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="text-sm text-muted-foreground">Today</h3>
                  <p className="text-2xl font-bold text-card-foreground">$180.00</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="text-sm text-muted-foreground">This Week</h3>
                  <p className="text-2xl font-bold text-card-foreground">$950.00</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-4">
                  <h3 className="text-sm text-muted-foreground">This Month</h3>
                  <p className="text-2xl font-bold text-card-foreground">$3,750.00</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Messages</h2>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                     onClick={() => setMessagingOpen(true)}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">SJ</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-card-foreground">Sarah Johnson</h3>
                      <p className="text-sm text-muted-foreground">Could you please confirm your payment details?</p>
                    </div>
                    <div className="text-xs text-muted-foreground">2:30 PM</div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                     onClick={() => setMessagingOpen(true)}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">MC</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-card-foreground">Mike Chen</h3>
                      <p className="text-sm text-muted-foreground">Hi, I'm ready for pickup!</p>
                    </div>
                    <div className="text-xs text-muted-foreground">1:45 PM</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div>
              <h2 className="text-xl font-bold text-card-foreground mb-6">Schedule</h2>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Manage your schedule and availability</p>
                <Button onClick={() => setScheduleOpen(true)} variant="luxury">
                  Open Schedule
                </Button>
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
                    <p className="text-sm text-muted-foreground">Configure notification preferences</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenSettings("notifications")}
                  >
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium text-card-foreground">Privacy</h3>
                    <p className="text-sm text-muted-foreground">Manage privacy and account settings</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenSettings("privacy")}
                  >
                    Manage
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h3 className="font-medium text-card-foreground">Vehicle Information</h3>
                    <p className="text-sm text-muted-foreground">Update your vehicle details</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
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

        {/* Modals */}
        <MessagingInterface 
          isOpen={messagingOpen}
          onClose={() => setMessagingOpen(false)}
          userType="driver"
        />
        
        <DriverScheduleModal
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          isOnline={isOnline}
          onToggleOnline={() => setIsOnline(!isOnline)}
        />

        <DriverSettingsModal
          isOpen={settingsOpen}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsType(null);
          }}
          settingType={settingsType}
        />
      </div>
    </div>
  );
};

export default DriverDashboard;