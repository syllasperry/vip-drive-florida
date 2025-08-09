
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DispatcherBookingManager } from "./DispatcherBookingManager";
import { RefreshCw, Clock, MapPin, User, Car } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  status: string;
  ride_status: string;
  estimated_price: number;
  final_price: number;
  created_at: string;
  passenger_id: string;
  driver_id: string;
  passengers: {
    full_name: string;
    phone: string;
  };
  drivers?: {
    full_name: string;
    phone: string;
    car_make: string;
    car_model: string;
  };
}

export const DispatcherBookingList = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadBookings = async () => {
    try {
      console.log('📋 Loading all bookings for dispatcher');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            full_name,
            phone
          ),
          drivers (
            full_name,
            phone,
            car_make,
            car_model
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading bookings:', error);
        throw error;
      }

      console.log('✅ Loaded bookings:', data?.length || 0);
      setBookings(data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Failed to load bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadBookings();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'offer_sent':
        return 'default';
      case 'payment_confirmed':
        return 'outline';
      case 'all_set':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    return status?.replace(/_/g, ' ').toUpperCase() || 'PENDING';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Carregando Bookings...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Gerenciamento de Bookings
              </CardTitle>
              <CardDescription>
                Gerencie todos os bookings de passageiros e atribuições de motoristas
              </CardDescription>
            </div>
            <Button onClick={loadBookings} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum booking encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passageiro</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {booking.passengers?.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.passengers?.phone || ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <span className="truncate max-w-[150px]">
                              {booking.pickup_location}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-red-600" />
                            <span className="truncate max-w-[150px]">
                              {booking.dropoff_location}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <div className="text-sm">
                            {format(new Date(booking.pickup_time), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.drivers ? (
                          <div>
                            <div className="font-medium text-sm">
                              {booking.drivers.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.drivers.car_make} {booking.drivers.car_model}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Não atribuído
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${booking.final_price || booking.estimated_price || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.ride_status || booking.status)}>
                          {formatStatus(booking.ride_status || booking.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DispatcherBookingManager 
                          booking={booking} 
                          onUpdate={loadBookings}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
            <span>Total de bookings: {bookings.length}</span>
            <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
