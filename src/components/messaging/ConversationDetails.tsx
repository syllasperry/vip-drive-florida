import { X, MessageCircle, Star, MapPin, Calendar, User, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ConversationDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  otherUser: any;
  userType: "passenger" | "driver";
}

export const ConversationDetails = ({
  isOpen,
  onClose,
  booking,
  otherUser,
  userType
}: ConversationDetailsProps) => {
  if (!isOpen) return null;

  const formatStatus = (status: string) => {
    switch (status) {
      case 'payment_confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'price_proposed':
        return 'Price Proposed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'payment_confirmed':
        return 'bg-green-500/10 text-green-700';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700';
      case 'price_proposed':
        return 'bg-yellow-500/10 text-yellow-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-background rounded-t-3xl w-full max-w-md h-[80vh] flex flex-col shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-background rounded-t-3xl z-10 p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Reservation details</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Reservation Summary */}
          <div className="bg-muted/50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={otherUser?.profile_photo_url} alt={otherUser?.full_name} />
                <AvatarFallback>
                  {otherUser?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{otherUser?.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getStatusColor(booking.status)}>
                    {formatStatus(booking.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(booking.pickup_time).toLocaleDateString([], { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {booking.pickup_location?.split(',')[0]} - {booking.dropoff_location?.split(',')[0]}
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full mt-3 text-primary hover:text-primary/80"
              onClick={onClose}
            >
              Show details →
            </Button>
          </div>

          {/* Participants */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">In this conversation</h3>
            <div className="space-y-3">
              {/* Other User */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={otherUser?.profile_photo_url} alt={otherUser?.full_name} />
                    <AvatarFallback>
                      {otherUser?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    {userType === 'passenger' ? (
                      <Car className="w-3 h-3 text-primary-foreground" />
                    ) : (
                      <User className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground">{otherUser?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {userType === 'passenger' ? 'Driver' : 'Passenger'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Trip details</h3>
            <div className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pickup Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.pickup_time).toLocaleDateString([], { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })} at {new Date(booking.pickup_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pickup</p>
                  <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                </div>
              </div>

              {/* Dropoff Location */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Dropoff</p>
                  <p className="text-sm text-muted-foreground">{booking.dropoff_location}</p>
                </div>
              </div>

              {/* Price */}
              {(booking.final_price || booking.estimated_price) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">$</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Trip Cost</p>
                    <p className="text-sm text-muted-foreground">
                      ${booking.final_price || booking.estimated_price}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Conversation Actions */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Conversation actions</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start" size="lg">
                <MessageCircle className="w-5 h-5 mr-3" />
                Mark as unread
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="lg">
                <Star className="w-5 h-5 mr-3" />
                Star
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
