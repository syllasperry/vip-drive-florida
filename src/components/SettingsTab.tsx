
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  passengerInfo: any;
}

export const SettingsTab = ({ passengerInfo }: SettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/passenger/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold">Profile</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{passengerInfo?.full_name || "Passenger"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
