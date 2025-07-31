import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, User, CreditCard, Thermometer, Volume2, VolumeX, MessageSquare, MessageSquareOff, Navigation, Map, ChevronDown } from "lucide-react";

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  payment_method?: string;
  passengers?: {
    full_name: string;
    profile_photo_url?: string;
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

  const handleMapNavigation = (navApp: string, pickup: string, dropoff: string) => {
    const pickupEncoded = encodeURIComponent(pickup);
    const dropoffEncoded = encodeURIComponent(dropoff);
    
    let url = '';
    switch (navApp) {
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&origin=${pickupEncoded}&destination=${dropoffEncoded}&travelmode=driving`;
        break;
      case 'apple':
        url = `https://maps.apple.com/?saddr=${pickupEncoded}&daddr=${dropoffEncoded}&dirflg=d`;
        break;
      case 'waze':
        url = `https://www.waze.com/ul?q=${dropoffEncoded}&navigate=yes&from=${pickupEncoded}`;
        break;
      default:
        url = `https://www.google.com/maps/dir/?api=1&origin=${pickupEncoded}&destination=${dropoffEncoded}&travelmode=driving`;
    }
    
    window.location.href = url;
    
    toast({
      title: `Abrindo ${navApp === 'apple' ? 'Apple Maps' : navApp === 'waze' ? 'Waze' : 'Google Maps'}`,
      description: "Redirecionando para o app de navegação...",
    });
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
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">To-Do</h1>
        
        {bookings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma corrida com status "All Set" encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const { date, time } = formatDateTime(booking.pickup_time);
              
              return (
                <Card key={booking.id} className="border border-border">
                  <CardContent className="p-6">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        All Set
                      </Badge>
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
                        <div>
                          <p className="font-semibold text-foreground">{booking.passengers.full_name}</p>
                          <p className="text-sm text-muted-foreground">Passageiro</p>
                        </div>
                      </div>
                    )}

                    {/* Date and Time */}
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{date} às {time}</span>
                    </div>

                    {/* Locations */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Origem</p>
                          <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Destino</p>
                          <p className="text-sm text-muted-foreground">{booking.dropoff_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    {booking.payment_method && (
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          Método de pagamento: {booking.payment_method}
                        </span>
                      </div>
                    )}

                    {/* Passenger Preferences */}
                    {booking.passengers && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Preferências do Passageiro
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Temperature */}
                          {booking.passengers.preferred_temperature && (
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-foreground">
                                {booking.passengers.preferred_temperature}°C
                              </span>
                            </div>
                          )}
                          
                          {/* Music Preference */}
                          {booking.passengers.music_preference && (
                            <div className="flex items-center gap-2">
                              {booking.passengers.music_preference === 'yes' || 
                               booking.passengers.music_preference === 'on' ? (
                                <Volume2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <VolumeX className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm text-foreground">
                                {booking.passengers.music_preference === 'yes' || 
                                 booking.passengers.music_preference === 'on' ? 
                                 'Gosta de música' : 'Sem música'}
                              </span>
                            </div>
                          )}
                          
                          {/* Interaction Preference */}
                          {booking.passengers.interaction_preference && (
                            <div className="flex items-center gap-2">
                              {booking.passengers.interaction_preference === 'talk' ? (
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                              ) : (
                                <MessageSquareOff className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-sm text-foreground">
                                {booking.passengers.interaction_preference === 'talk' ? 
                                 'Gosta de conversar' : 'Prefere silêncio'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Maps Navigation Buttons */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <h5 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Navegação
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleMapNavigation('google', booking.pickup_location, booking.dropoff_location)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Map className="h-4 w-4" />
                          Google Maps
                        </Button>
                        <Button
                          onClick={() => handleMapNavigation('apple', booking.pickup_location, booking.dropoff_location)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Navigation className="h-4 w-4" />
                          Apple Maps
                        </Button>
                        <Button
                          onClick={() => handleMapNavigation('waze', booking.pickup_location, booking.dropoff_location)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          Waze
                        </Button>
                      </div>
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