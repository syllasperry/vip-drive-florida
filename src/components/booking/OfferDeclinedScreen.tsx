import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, RotateCcw } from "lucide-react";

interface OfferDeclinedScreenProps {
  onNewRequest: () => void;
}

export const OfferDeclinedScreen = ({ onNewRequest }: OfferDeclinedScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Offer Declined
            </h2>
            <p className="text-muted-foreground">
              You declined the driver's offer. Would you like to request a new ride?
            </p>
          </div>
          
          <Button 
            onClick={onNewRequest}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            New Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};