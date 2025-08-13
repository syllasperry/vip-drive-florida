
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedBookingCard } from "./EnhancedBookingCard";
import { AlertCircle, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TodoTabProps {
  userType: "passenger" | "driver";
  userId: string;
  onMessage: (booking: any) => void;
  onViewSummary: (booking: any) => void;
  onMakePayment?: (booking: any) => void;
  onConfirmPayment?: (booking: any) => void;
  onAcceptOffer?: (booking: any) => void;
  onEditPrice?: (booking: any) => void;
}

export const TodoTab = ({ 
  userType, 
  userId, 
  onMessage, 
  onViewSummary,
  onMakePayment,
  onConfirmPayment,
  onAcceptOffer,
  onEditPrice
}: TodoTabProps) => {
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingActions();
  }, [userId, userType]);

  const fetchPendingActions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          drivers (
            id,
            full_name,
            profile_photo_url,
            car_make,
            car_model,
            venmo_info,
            zelle_info
          ),
          passengers (
            id,
            full_name,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            music_playlist_link,
            interaction_preference,
            trip_purpose,
            additional_notes
          )
        `);

      if (userType === "passenger") {
        query = query.eq('passenger_id', userId);
      } else {
        query = query.eq('driver_id', userId);
      }

      const { data, error } = await query
        .in('ride_status', ['pending_driver', 'offer_sent', 'confirmed'])
        .or('payment_confirmation_status.eq.all_set')
        .order('pickup_time', { ascending: false }); // Most recent first

      if (error) throw error;

      // Ensure data is always an array and add null-safety
      const safeData = Array.isArray(data) ? data : [];

      // Filter for bookings that need action or are ready for navigation
      const actionableBookings = safeData.filter(booking => {
        if (userType === "passenger") {
          return (
            booking?.payment_confirmation_status === 'price_awaiting_acceptance' ||
            booking?.payment_confirmation_status === 'waiting_for_payment' ||
            booking?.payment_confirmation_status === 'all_set'
          );
        } else {
          return (
            booking?.ride_status === 'pending_driver' ||
            booking?.payment_confirmation_status === 'passenger_paid' ||
            booking?.payment_confirmation_status === 'all_set'
          );
        }
      });

      setPendingActions(actionableBookings);
    } catch (error) {
      console.error('Error fetching pending actions:', error);
      // Set empty array on error to prevent .map() issues
      setPendingActions([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionType = (booking: any) => {
    if (userType === "passenger") {
      if (booking?.payment_confirmation_status === 'price_awaiting_acceptance') {
        return { type: 'accept_offer', icon: DollarSign, text: 'Accept Price Offer', color: 'bg-blue-100 text-blue-800' };
      }
      if (booking?.payment_confirmation_status === 'waiting_for_payment') {
        return { type: 'make_payment', icon: DollarSign, text: 'Make Payment', color: 'bg-yellow-100 text-yellow-800' };
      }
      if (booking?.payment_confirmation_status === 'all_set') {
        return { type: 'all_set', icon: Clock, text: 'Ready for Pickup', color: 'bg-green-100 text-green-800' };
      }
    } else {
      if (booking?.ride_status === 'pending_driver') {
        return { type: 'send_offer', icon: Clock, text: 'Send Price Offer', color: 'bg-orange-100 text-orange-800' };
      }
      if (booking?.payment_confirmation_status === 'passenger_paid') {
        return { type: 'confirm_payment', icon: DollarSign, text: 'Confirm Payment', color: 'bg-green-100 text-green-800' };
      }
      if (booking?.payment_confirmation_status === 'all_set') {
        return { type: 'all_set', icon: Clock, text: 'Ready for Pickup', color: 'bg-green-100 text-green-800' };
      }
    }
    return { type: 'unknown', icon: AlertCircle, text: 'Action Required', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (pendingActions.length === 0) {
    return (
      <div className="p-4">
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-medium text-foreground mb-2">All caught up!</h3>
            <p className="text-sm text-muted-foreground">
              {userType === 'driver' ? 'No pending rides or actions at the moment.' : 'You have no pending actions at the moment.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="border-border/50 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            {userType === 'driver' ? 'My Rides & Actions' : 'Pending Actions'}
            <Badge className="ml-2 bg-orange-100 text-orange-800">
              {pendingActions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {/* Add null-safety to the map */}
        {(pendingActions ?? []).map((booking) => {
          const actionType = getActionType(booking);
          const ActionIcon = actionType.icon;
          
          return (
            <div key={booking?.id || Math.random()} className="relative">
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className={`${actionType.color} shadow-md`}>
                  <ActionIcon className="h-3 w-3 mr-1" />
                  {actionType.text}
                </Badge>
              </div>
              
              <EnhancedBookingCard
                booking={booking}
                userType={userType}
                onMessage={() => onMessage(booking)}
                onViewSummary={() => onViewSummary(booking)}
                onMakePayment={actionType.type === 'make_payment' ? () => onMakePayment?.(booking) : undefined}
                onConfirmPayment={actionType.type === 'confirm_payment' ? () => onConfirmPayment?.(booking) : undefined}
                onAcceptOffer={actionType.type === 'accept_offer' ? () => onAcceptOffer?.(booking) : undefined}
                onEditPrice={actionType.type === 'send_offer' ? () => onEditPrice?.(booking) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
