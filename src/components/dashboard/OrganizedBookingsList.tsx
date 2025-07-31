import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingCard } from './BookingCard';
import { Badge } from "@/components/ui/badge";

interface OrganizedBookingsListProps {
  bookings: any[];
  userType: 'passenger' | 'driver';
  onMessage: (booking: any) => void;
  onReview?: (bookingId: string) => void;
  onViewSummary?: (booking: any) => void;
  onCancelSuccess?: () => void;
  onNavigate?: (booking: any) => void;
}

const OrganizedBookingsList: React.FC<OrganizedBookingsListProps> = ({
  bookings,
  userType,
  onMessage,
  onReview,
  onViewSummary,
  onCancelSuccess,
  onNavigate
}) => {
  // Sort all bookings by updated_at and pickup_time to prioritize most recent activity
  const sortedBookings = [...bookings].sort((a, b) => {
    // First, prioritize by status importance (newer activity first)
    const statusPriority = {
      'price_proposed': 1,
      'pending': 2,
      'accepted': 3,
      'confirmed': 3,
      'payment_confirmed': 4,
      'ready_to_go': 5,
      'completed': 6,
      'cancelled': 7,
      'declined': 7,
      'rejected_by_passenger': 7
    };
    
    const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 8;
    const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 8;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Then sort by pickup time (most recent first)
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateB.getTime() - dateA.getTime();
  });

  // Group bookings by status
  const statusGroups = {
    pending: sortedBookings.filter(b => b.status === 'pending'),
    confirmed: sortedBookings.filter(b => b.status === 'accepted' || b.status === 'confirmed'),
    payment_confirmed: sortedBookings.filter(b => 
      b.status === 'payment_confirmed' || 
      b.status === 'price_proposed' || 
      b.status === 'ready_to_go'
    ),
    completed: sortedBookings.filter(b => b.status === 'completed'),
    canceled: sortedBookings.filter(b => 
      b.status === 'cancelled' || 
      b.status === 'declined' || 
      b.status === 'rejected_by_passenger'
    )
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: '🟡 ⏳ Pending',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      case 'confirmed':
        return {
          title: '🟢 ✅ Confirmed',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'payment_confirmed':
        return {
          title: '🔵 💸 Payment Confirmed',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'completed':
        return {
          title: '🟤 ✅ Completed',
          bgColor: 'bg-slate-50 dark:bg-slate-950/20',
          borderColor: 'border-slate-200 dark:border-slate-800'
        };
      case 'canceled':
        return {
          title: '🔴 ❌ Canceled',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      default:
        return {
          title: status,
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted'
        };
    }
  };

  const hasAnyBookings = Object.values(statusGroups).some(group => group.length > 0);

  if (!hasAnyBookings) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No bookings found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(statusGroups).map(([status, bookings]) => {
        if (bookings.length === 0) return null;
        
        const config = getStatusConfig(status);
        
        return (
          <div key={status} className="space-y-3">
            {/* Status Header */}
            <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3`}>
              <h3 className="font-semibold text-foreground">{config.title}</h3>
              <p className="text-sm text-muted-foreground">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
            </div>
            
            {/* Bookings in this status */}
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="border-2 border-primary/20 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] transition-all duration-300 bg-gradient-to-br from-card via-card/95 to-primary/5 backdrop-blur-sm mb-6 p-1">
                  <BookingCard
                    booking={booking}
                    userType={userType}
                    onMessage={() => onMessage(booking)}
                    onReview={onReview ? () => onReview(booking.id) : undefined}
                    onViewSummary={onViewSummary ? () => onViewSummary(booking) : undefined}
                    onCancelSuccess={onCancelSuccess}
                    onNavigate={onNavigate ? () => onNavigate(booking) : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrganizedBookingsList;