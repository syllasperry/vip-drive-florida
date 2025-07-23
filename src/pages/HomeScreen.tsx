import { useNavigate } from "react-router-dom";
import { Plane, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Welcome to VIP</h1>
          <p className="text-lg text-muted-foreground">
            Choose your experience
          </p>
        </div>

        <div className="space-y-6">
          <Button
            variant="passenger"
            size="xl"
            onClick={() => navigate("/passenger/price-estimate")}
            className="w-full space-y-2 h-auto py-8 flex flex-col"
          >
            <Plane className="h-12 w-12" />
            <div className="space-y-1">
              <div className="text-xl font-bold">I'm a Passenger</div>
              <div className="text-sm opacity-90">Book your premium ride</div>
            </div>
          </Button>

          <Button
            variant="driver"
            size="xl"
            onClick={() => navigate("/driver/login")}
            className="w-full space-y-2 h-auto py-8 flex flex-col"
          >
            <Car className="h-12 w-12" />
            <div className="space-y-1">
              <div className="text-xl font-bold">I'm a Driver</div>
              <div className="text-sm opacity-90">Access your dashboard</div>
            </div>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Premium chauffeur service in South Florida
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;