import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, User, CreditCard, Thermometer, Volume2, VolumeX, MessageSquare, MessageSquareOff, Phone, FileText, ChevronDown } from "lucide-react";

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  payment_method?: string;
  passengers?: {
    full_name: string;
    profile_photo_url?: string;
    phone?: string;
    preferred_temperature?: number;
    music_preference?: string;
    interaction_preference?: string;
  };
}

const ToDoPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllSetBookings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return;
        }

        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            pickup_location,
            dropoff_location,
            pickup_time,
            payment_method,
            passengers (
              full_name,
              profile_photo_url,
              phone,
              preferred_temperature,
              music_preference,
              interaction_preference
            )
          `)
          .eq('driver_id', session.user.id)
          .eq('payment_confirmation_status', 'all_set')
          .order('pickup_time', { ascending: false });

        if (error) {
          console.error('Error fetching bookings:', error);
          toast({
            title: "Error",
            description: "Failed to load bookings",
            variant: "destructive",
          });
          return;
        }

        setBookings(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllSetBookings();
  }, [toast]);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6">To-Do</h1>
          <div className="text-center text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">To Do</h1>
        
        {bookings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma corrida com status "All Set" encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const { date, time } = formatDateTime(booking.pickup_time);
              
              return (
                <Card key={booking.id} className="bg-card border-border rounded-2xl overflow-hidden shadow-sm">
                  <CardContent className="p-4">
                    {/* Header with ride type and date */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">Lhaff chaffer ride</h3>
                        <p className="text-sm text-muted-foreground">{date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{time}</p>
                      </div>
                    </div>

                    {/* Passenger Info */}
                    {booking.passengers && (
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={booking.passengers.profile_photo_url} 
                            alt={booking.passengers.full_name} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {booking.passengers.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{booking.passengers.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.pickup_location} → {booking.dropoff_location}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phone Number */}
                    {booking.passengers?.phone && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Phone Number</span>
                        <span className="text-sm font-medium text-foreground">{booking.passengers.phone}</span>
                      </div>
                    )}

                    {/* Passenger Preferences */}
                    {booking.passengers?.preferred_temperature && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Passenger boforelis</span>
                        <span className="text-sm font-medium text-foreground">{booking.passengers.preferred_temperature}°C</span>
                      </div>
                    )}

                    {/* Music/Sound Migration */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50 mb-4">
                      <span className="text-sm text-muted-foreground">Sais migration</span>
                      <span className="text-sm font-medium text-foreground">
                        {booking.passengers?.music_preference === 'yes' || booking.passengers?.music_preference === 'on' ? 'Music On' : 'Music Off'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-4">
                      {/* Summary Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-muted/50 hover:bg-muted text-foreground border-border"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Summary
                      </Button>

                      {/* Maps Button */}
                      <div className="flex-1 relative">
                        <select 
                          className="w-full appearance-none bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium h-9 pr-8 cursor-pointer hover:bg-primary/90 transition-colors"
                          onChange={(e) => {
                            const navApp = e.target.value;
                            if (!navApp) return;
                            
                            const pickup = encodeURIComponent(booking.pickup_location || '');
                            const dropoff = encodeURIComponent(booking.dropoff_location || '');
                            
                            let url = '';
                            switch (navApp) {
                              case 'google':
                                url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                                break;
                              case 'apple':
                                url = `https://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=d`;
                                break;
                              case 'waze':
                                url = `https://www.waze.com/ul?q=${dropoff}&navigate=yes&from=${pickup}`;
                                break;
                              default:
                                url = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}&travelmode=driving`;
                            }
                            
                            window.location.href = url;
                            
                            toast({
                              title: `Opening ${navApp === 'apple' ? 'Apple Maps' : navApp === 'waze' ? 'Waze' : 'Google Maps'}`,
                              description: "Redirecting to navigation app...",
                            });
                            
                            // Reset select
                            e.target.value = '';
                          }}
                        >
                          <option value="">Maps</option>
                          <option value="google">Google Maps</option>
                          <option value="apple">Apple Maps</option>
                          <option value="waze">Waze</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Upcoming entries section */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-foreground">Upcoming entries</h4>
                        <span className="text-xs text-muted-foreground">{time}</span>
                      </div>
                      
                      {/* Trip preferences in compact grid */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="font-medium text-foreground">Air State</p>
                          <p className="text-muted-foreground">
                            {booking.passengers?.preferred_temperature ? `${booking.passengers.preferred_temperature}°C` : 'Fitab'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">Air Ente</p>
                          <p className="text-muted-foreground">
                            {booking.passengers?.music_preference === 'yes' || booking.passengers?.music_preference === 'on' ? 'Fitris' : 'Silent'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-foreground">Sila Infoss</p>
                          <p className="text-muted-foreground">
                            {booking.passengers?.interaction_preference === 'talk' ? 'Talk' : 'Rius'}
                          </p>
                        </div>
                      </div>

                      {/* Maps and Secondary buttons */}
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-xs">
                          <p className="font-medium text-foreground">Rider ar paty masitantion</p>
                          <p className="text-muted-foreground">Maps</p>
                        </div>
                        <div className="text-xs text-right">
                          <p className="font-medium text-foreground">Ror fast</p>
                          <p className="text-muted-foreground">Sertionary</p>
                        </div>
                      </div>
                    </div>

                    {/* All Set status */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-foreground">All Set</span>
                      </div>
                      <span className="text-sm text-muted-foreground">1</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToDoPage;