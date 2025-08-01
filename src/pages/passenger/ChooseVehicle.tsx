import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, Luggage, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import CelebrationModal from "@/components/CelebrationModal";
import teslaImg from "@/assets/tesla-model-y.jpg";
import bmwImg from "@/assets/bmw-sedan.jpg";
import chevroletImg from "@/assets/chevrolet-suv.jpg";
import mercedesImg from "@/assets/mercedes-van.jpg";

const vehicles = [
  {
    id: "tesla-y",
    name: "Tesla Model Y",
    make: "Tesla",
    model: "Model Y",
    codeType: "electric_car",
    image: teslaImg,
    passengers: 4,
    luggage: 3,
    description: "Premium electric vehicle with advanced features",
    available: true
  },
  {
    id: "bmw-sedan",
    name: "BMW 5 Series",
    make: "BMW",
    model: "5 Series",
    codeType: "luxury_sedan",
    image: bmwImg,
    passengers: 4,
    luggage: 2,
    description: "Luxury sedan with sophisticated comfort",
    available: true
  },
  {
    id: "chevrolet-suv",
    name: "Chevrolet Tahoe",
    make: "Chevrolet",
    model: "Tahoe",
    codeType: "luxury_suv",
    image: chevroletImg,
    passengers: 7,
    luggage: 5,
    description: "Spacious SUV perfect for groups and families",
    available: true
  },
  {
    id: "mercedes-van",
    name: "Mercedes-Benz Sprinter",
    make: "Mercedes-Benz",
    model: "Sprinter",
    codeType: "luxury_van",
    image: mercedesImg,
    passengers: 8,
    luggage: 8,
    description: "Premium van for large groups",
    available: false,
    comingSoon: true
  }
];

const ChooseVehicle = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state;

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch passenger data
        const { data: passenger } = await supabase
          .from('passengers')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setUser(passenger);
      }
    };

    fetchUserData();

    // Check if we should show welcome celebration
    const shouldShowCelebration = localStorage.getItem("show_welcome_celebration");
    if (shouldShowCelebration === "true") {
      setShowCelebration(true);
      localStorage.removeItem("show_welcome_celebration");
    }
  }, []);

  const handleContinue = () => {
    if (selectedVehicle) {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      navigate("/passenger/booking-form", { 
        state: { 
          ...bookingData, 
          selectedVehicle: vehicle 
        } 
      });
    }
  };

  const handleDashboardClick = () => {
    navigate("/passenger/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* User profile header */}
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDashboardClick}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            <Avatar className="w-6 h-6 mr-2">
              <AvatarImage 
                src={user?.profile_photo_url || undefined} 
                alt={user?.full_name || "User"} 
              />
              <AvatarFallback>
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <span>{user?.full_name?.split(' ')[0] || 'User'}</span>
            <span className="mx-1">•</span>
            <span className="text-green-500">Online</span>
            <span className="ml-1">— Go to Dashboard</span>
          </Button>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Choose Your Vehicle</h1>
          <p className="text-muted-foreground">Select the perfect ride for your journey</p>
        </div>

        <div className="space-y-4 mb-8">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`bg-card rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                selectedVehicle === vehicle.id 
                  ? "ring-2 ring-primary transform scale-[1.02]" 
                  : "hover:shadow-xl"
              } ${
                !vehicle.available 
                  ? "opacity-60" 
                  : "cursor-pointer"
              }`}
              onClick={() => vehicle.available && setSelectedVehicle(vehicle.id)}
            >
              <div className="relative">
                <img 
                  src={vehicle.image} 
                  alt={vehicle.name}
                  className="w-full h-48 object-cover"
                />
                {vehicle.comingSoon && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold">
                      Coming Soon
                    </span>
                  </div>
                )}
                {selectedVehicle === vehicle.id && vehicle.available && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-2">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-card-foreground">{vehicle.name}</h3>
                  {selectedVehicle === vehicle.id && vehicle.available && (
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      Selected
                    </div>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-4">{vehicle.description}</p>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm text-card-foreground">
                      {vehicle.passengers} passengers
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Luggage className="h-5 w-5 text-primary" />
                    <span className="text-sm text-card-foreground">
                      {vehicle.luggage} luggage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedVehicle}
          variant="luxury"
          size="lg"
          className="w-full"
        >
          Continue with Selected Vehicle
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            All vehicles are professionally maintained and chauffeur-driven
          </p>
        </div>
      </div>

      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title={`🎉 Welcome, ${user?.full_name?.split(' ')[0] || 'VIP'}! 🥂`}
        message="You are now a VIP member. Your exclusive ride experience begins now."
        actionText="Choose Your Vehicle"
        onAction={() => setShowCelebration(false)}
        showConfetti={true}
      />
    </div>
  );
};

export default ChooseVehicle;