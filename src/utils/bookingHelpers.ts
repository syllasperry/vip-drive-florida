
import { format } from "date-fns";

export const normalizeBookingStatus = (booking: any): string => {
  if (typeof booking === 'string') {
    return booking;
  }
  
  // Handle various booking object structures
  if (booking?.status) {
    return booking.status;
  }
  
  if (booking?.ride_status) {
    return booking.ride_status;
  }
  
  if (booking?.status_passenger) {
    return booking.status_passenger;
  }
  
  return 'unknown';
};

export const mapToSimpleStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'in_progress': 'active',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'driver_assigned': 'confirmed',
    'en_route': 'active',
    'arrived': 'active',
    'in_transit': 'active'
  };
  
  return statusMap[status] || status;
};

export const updateBookingStatus = async (bookingId: string, updates: Record<string, any>): Promise<void> => {
  // This function would typically update the booking in the database
  // For now, it's a placeholder that accepts the updates object
  console.log(`Updating booking ${bookingId} with:`, updates);
};

export const getBookingStatusDisplay = (status: string): { label: string; color: string } => {
  const statusDisplayMap: Record<string, { label: string; color: string }> = {
    'pending': { label: 'Pending', color: 'orange' },
    'confirmed': { label: 'Confirmed', color: 'blue' },
    'active': { label: 'Active', color: 'green' },
    'completed': { label: 'Completed', color: 'gray' },
    'cancelled': { label: 'Cancelled', color: 'red' }
  };
  
  return statusDisplayMap[status] || { label: status, color: 'gray' };
};

export const formatDateTime = (dateString: string): string => {
  return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
};

export const formatTime = (dateString: string): string => {
  return format(new Date(dateString), "h:mm a");
};

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), "MMM dd, yyyy");
};
