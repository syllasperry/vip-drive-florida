
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, User, Car, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatusEvent {
  id: string;
  status: string;
  timestamp: string;
  actor: 'passenger' | 'driver' | 'system';
  message: string;
}

interface PassengerStatusTimelineProps {
  booking: any;
}

export const PassengerStatusTimeline = ({ booking }: PassengerStatusTimelineProps) => {
  const [statusHistory, setStatusHistory] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!booking?.id) return;

    const createStatusHistory = () => {
      const events: StatusEvent[] = [];
      
      // Sempre adicionar evento de criação
      events.push({
        id: 'created',
        status: 'passenger_requested',
        timestamp: booking.created_at,
        actor: 'passenger',
        message: 'Solicitação de viagem enviada'
      });

      // Se tem final_price diferente do estimated_price, driver fez oferta
      if (booking.final_price && booking.final_price !== booking.estimated_price) {
        events.push({
          id: 'offer_sent',
          status: 'offer_sent',
          timestamp: booking.updated_at,
          actor: 'driver',
          message: `Motorista enviou oferta: $${booking.final_price}`
        });
      }

      // Se driver aceitou com preço estimado
      if (booking.status_driver === 'driver_accepted' || booking.ride_status === 'driver_accepted') {
        events.push({
          id: 'driver_accepted',
          status: 'driver_accepted',
          timestamp: booking.updated_at,
          actor: 'driver',
          message: 'Motorista aceitou a viagem'
        });
      }

      // Se passageiro aceitou oferta
      if (booking.status_passenger === 'offer_accepted') {
        events.push({
          id: 'offer_accepted',
          status: 'offer_accepted',
          timestamp: booking.updated_at,
          actor: 'passenger',
          message: 'Você aceitou a oferta'
        });
      }

      // Pagamento confirmado pelo passageiro
      if (booking.payment_confirmation_status === 'passenger_paid') {
        events.push({
          id: 'payment_sent',
          status: 'payment_sent',
          timestamp: booking.passenger_payment_confirmed_at || booking.updated_at,
          actor: 'passenger',
          message: 'Pagamento confirmado por você'
        });
      }

      // Tudo pronto - driver confirmou pagamento
      if (booking.payment_confirmation_status === 'all_set') {
        events.push({
          id: 'all_set',
          status: 'all_set',
          timestamp: booking.driver_payment_confirmed_at || booking.updated_at,
          actor: 'driver',
          message: 'Motorista confirmou pagamento - Tudo pronto!'
        });
      }

      console.log('📊 Status history criado:', events);
      setStatusHistory(events);
      setLoading(false);
    };

    createStatusHistory();

    // Subscription em tempo real para mudanças no booking
    const channel = supabase
      .channel(`booking-timeline-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${booking.id}`
        },
        (payload) => {
          console.log('🔄 Booking atualizado, recriando timeline:', payload);
          // Recriar timeline com dados atualizados
          const updatedBooking = { ...booking, ...payload.new };
          createStatusHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passenger_requested':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'offer_sent':
      case 'driver_accepted':
        return <Car className="h-4 w-4 text-orange-500" />;
      case 'offer_accepted':
      case 'payment_sent':
      case 'all_set':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActorBadge = (actor: string) => {
    const colors = {
      passenger: 'bg-blue-100 text-blue-800',
      driver: 'bg-green-100 text-green-800',
      system: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[actor as keyof typeof colors] || colors.system}>
        {actor === 'passenger' ? 'Você' : actor === 'driver' ? 'Motorista' : 'Sistema'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico da Viagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico da Viagem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.map((event, index) => (
            <div key={event.id} className="relative flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(event.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActorBadge(event.actor)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {event.message}
                </p>
              </div>
              {index < statusHistory.length - 1 && (
                <div 
                  className="absolute left-2 top-8 w-px h-6 bg-border"
                  style={{ marginTop: '4px' }}
                />
              )}
            </div>
          ))}
          
          {statusHistory.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma atualização de status disponível
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
