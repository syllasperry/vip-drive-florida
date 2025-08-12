import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Calendar, Phone, Mail, Car } from "lucide-react";
import { BookingManagementModal } from "./BookingManagementModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendOffer } from "@/data/bookings";

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  profile_photo_url?: string;
  car_make: string;
  car_model: string;
  car_color: string;
  license_plate: string;
}

interface DispatcherBookingListProps {
  bookings: any[];
  onUpdate: () => void;
}

export const DispatcherBookingList = ({ bookings, onUpdate }: DispatcherBookingListProps) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadDrivers = async () => {
      console.log('[DISPATCHER LOAD] fetching drivers...');
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) {
        console.error('Error loading drivers:', error);
        return;
      }
      
      console.log('[DISPATCHER LOAD] drivers loaded:', data?.length || 0);
      setDrivers(data || []);
    };

    loadDrivers();
  }, []);

  const handleQuickAssign = async (booking: any, driverId: string) => {
    try {
      console.log('🚀 Quick assigning driver to booking:', { booking_id: booking.id, driver_id: driverId });
      
      // GUARD: Verificar payload antes de enviar
      const updatePayload = {
        driver_id: driverId,
        status: 'assigned',
        ride_status: 'assigned_by_dispatcher',
        status_driver: 'assigned',
        status_passenger: 'driver_assigned',
        updated_at: new Date().toISOString()
      };
      
      console.log('[GUARD] payload to bookings update:', updatePayload);
      
      // IMPORTANT: Only include driver_id when manually assigning (respecting constraint)
      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', booking.id);

      if (error) {
        console.error('❌ Error in quick assign:', error);
        throw error;
      }

      console.log('✅ Driver assigned successfully via quick assign');
      
      toast({
        title: "Driver Assigned",
        description: "Driver has been successfully assigned to this booking.",
      });

      onUpdate();
    } catch (error) {
      console.error('❌ Error assigning driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendOffer = async (bookingId: string, driverId: string, price: number) => {
    try {
      console.log('[SEND_OFFER] payload', { bookingId, driverId, finalPrice: price });
      
      const updatedBooking = await sendOffer(bookingId, driverId, price);
      
      console.log('[SEND_OFFER] result', { data: updatedBooking, error: null });

      toast({
        title: "Offer Sent Successfully",
        description: `Driver assigned and price offer of $${price} sent to passenger.`,
      });

      onUpdate();
      setIsModalOpen(false);
      setSelectedBooking(null);

    } catch (error) {
      console.log('[SEND_OFFER] result', { data: null, error });
      
      // Show the actual error message from Supabase
      const errorMessage = error instanceof Error ? error.message : "Failed to send offer. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const openManageModal = (booking: any) => {
    console.log('📝 Opening booking management modal for:', booking.id);
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (booking: any) => {
    if (booking.status === 'payment_pending' || booking.payment_confirmation_status === 'pending') {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Offer Sent</Badge>;
    } else if (booking.driver_id && booking.final_price) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Offer Sent</Badge>;
    } else if (booking.driver_id) {
      return <Badge variant="secondary">Driver Assigned</Badge>;
    } else {
      return <Badge variant="outline">Pending Assignment</Badge>;
    }
  };

  const getPriceDisplay = (booking: any) => {
    if (booking.final_price && booking.final_price > 0) {
      return `Price: $${booking.final_price}`;
    }
    return "Price pending";
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const { date, time } = formatDateTime(booking.pickup_time);
        
        return (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Booking #{booking.id.slice(-8).toUpperCase()}
                </CardTitle>
                {getStatusBadge(booking)}
              </div>
              
              {/* Passenger Information */}
              {booking.passengers && (
                <div className="flex items-center mt-2">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={booking.passengers.profile_photo_url || '/default-avatar.png'} />
                    <AvatarFallback>{booking.passengers.full_name?.[0] || 'P'}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-gray-900">
                    {booking.passengers.full_name}
                  </div>
                  {booking.passengers.phone && (
                    <div className="ml-4 flex items-center text-sm text-gray-600">
                      <Phone className="h-3 w-3 mr-1" />
                      {booking.passengers.phone}
                    </div>
                  )}
                  {booking.passengers.email && (
                    <div className="ml-4 flex items-center text-sm text-gray-600">
                      <Mail className="h-3 w-3 mr-1" />
                      {booking.passengers.email}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Trip Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pickup</p>
                      <p className="text-sm text-gray-600">{booking.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Drop-off</p>
                      <p className="text-sm text-gray-600">{booking.dropoff_location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm text-gray-600">{date} at {time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Passengers</p>
                      <p className="text-sm text-gray-600">{booking.passenger_count} passenger{booking.passenger_count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Type */}
              {booking.vehicle_type && (
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Vehicle: {booking.vehicle_type}</span>
                </div>
              )}

              {booking.drivers && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Assigned Driver:</p>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={booking.drivers.profile_photo_url} />
                      <AvatarFallback>{booking.drivers.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{booking.drivers.full_name}</p>
                      <p className="text-xs text-gray-600">
                        {booking.drivers.car_make} {booking.drivers.car_model} - {booking.drivers.license_plate}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {!booking.driver_id ? (
                  <>
                    <Button
                      onClick={() => openManageModal(booking)}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      Assign Driver & Set Price
                    </Button>
                    
                    <div className="flex gap-1">
                      {drivers.slice(0, 2).map((driver) => (
                        <Button
                          key={driver.id}
                          onClick={() => handleQuickAssign(booking, driver.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2"
                        >
                          Quick: {driver.full_name.split(' ')[0]}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : !booking.final_price ? (
                  <Button
                    onClick={() => openManageModal(booking)}
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    Set Price & Send Offer
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={() => openManageModal(booking)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Edit Booking
                    </Button>
                    <Badge variant="secondary" className="px-3 py-1">
                      {getPriceDisplay(booking)}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <BookingManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        booking={selectedBooking}
        drivers={drivers}
        onUpdate={onUpdate}
        onSendOffer={handleSendOffer}
      />
    </div>
  );
};
