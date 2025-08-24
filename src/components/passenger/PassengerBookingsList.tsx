
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Car, AlertCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useMyBookings } from '@/hooks/useMyBookings';
import type { MyBooking } from '@/hooks/useMyBookings';
import { PassengerStatusTimeline } from '@/components/dashboard/PassengerStatusTimeline';
import { Button } from "@/components/ui/button";

interface PassengerBookingsListProps {
  onUpdate?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'pending':
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
    case 'all_set':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatPrice = (priceCents?: number, currency: string = 'USD') => {
  if (!priceCents) return 'Price TBD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(priceCents / 100);
};

export const PassengerBookingsList: React.FC<PassengerBookingsListProps> = ({ onUpdate }) => {
  const { bookings, loading, error, refetch } = useMyBookings();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<MyBooking | null>(null);

  console.log('🎯 PassengerBookingsList render:', { 
    bookingsCount: bookings.length, 
    loading, 
    error
  });

  // Trigger parent update when bookings change
  React.useEffect(() => {
    if (onUpdate) {
      onUpdate();
    }
  }, [bookings, onUpdate]);

  const filterBookings = (bookings: MyBooking[], status: string) => {
    if (status === 'all') return bookings;
    if (status === 'active') {
      return bookings.filter(b => 
        !['completed', 'cancelled'].includes(b.status.toLowerCase())
      );
    }
    if (status === 'completed') {
      return bookings.filter(b => 
        ['completed', 'cancelled'].includes(b.status.toLowerCase())
      );
    }
    return bookings;
  };

  if (loading) {
    console.log('🔄 Showing loading state...');
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Carregando seus bookings...</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    console.log('❌ Showing error state:', error);
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-2">{error}</p>
        <Button 
          onClick={() => {
            console.log('🔄 Manual retry clicked');
            refetch();
          }}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  const filteredBookings = filterBookings(bookings, activeTab);
  console.log('📊 Filtered bookings for display:', filteredBookings.length, 'for tab:', activeTab);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos ({bookings.length})</TabsTrigger>
          <TabsTrigger value="active">
            Ativos ({filterBookings(bookings, 'active').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Finalizados ({filterBookings(bookings, 'completed').length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {activeTab === 'all' ? 'Nenhum booking encontrado' : `Nenhum booking ${activeTab}`}
              </p>
              <p className="text-gray-500 text-sm">
                {activeTab === 'all' ? 'Faça sua primeira viagem para começar!' : ''}
              </p>
              <Button 
                onClick={() => {
                  console.log('🔄 Refresh bookings clicked');
                  refetch();
                }}
                variant="outline"
                className="mt-4 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {booking.booking_code || `Booking ${booking.id.slice(0, 8)}`}
                      </CardTitle>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(booking.pickup_time), "MMM d, h:mm a")}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-900">{booking.pickup_location}</span>
                        </div>
                        <div className="flex items-start space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-900">{booking.dropoff_location}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {booking.driver_name || 'Motorista TBD'}
                          </span>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatPrice(booking.price_cents, 'USD')}
                        </div>
                      </div>

                      {selectedBooking?.id === booking.id && (
                        <div className="mt-4 pt-4 border-t">
                          <PassengerStatusTimeline
                            booking={booking as any}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
