import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MessageCircle } from "lucide-react";

interface PaymentExpiredAlertProps {
  isVisible: boolean;
  onContactDriver: () => void;
}

export const PaymentExpiredAlert = ({ isVisible, onContactDriver }: PaymentExpiredAlertProps) => {
  if (!isVisible) return null;

  return (
    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Payment Window Expired
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                The 1-hour payment window has expired. Please contact your driver to arrange a new payment option or request a time extension.
              </p>
            </div>
            
            <Button 
              onClick={onContactDriver}
              variant="outline"
              className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Driver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};