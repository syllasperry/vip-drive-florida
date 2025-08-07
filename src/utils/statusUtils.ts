
export const getUnifiedBookingStatus = (booking: any): string => {
  // Use unified_status from database if available
  if (booking.unified_status) {
    return booking.unified_status;
  }
  
  // Fallback logic for compatibility
  if (booking.payment_confirmation_status === 'all_set') return 'all_set';
  if (booking.payment_confirmation_status === 'passenger_paid') return 'payment_confirmed';
  if (booking.status_passenger === 'offer_accepted') return 'offer_accepted';
  if (booking.final_price && booking.final_price !== booking.estimated_price) return 'offer_sent';
  if (booking.status_driver === 'driver_accepted') return 'driver_accepted';
  
  return 'pending';
};

export const getStatusMessage = (status: string, userType: 'passenger' | 'driver'): { 
  primary: string; 
  secondary: string; 
  color: string;
} => {
  if (userType === 'passenger') {
    switch (status) {
      case 'pending':
        return { 
          primary: 'Ride Requested', 
          secondary: 'Waiting for driver response', 
          color: 'text-orange-600' 
        };
      case 'driver_accepted':
        return { 
          primary: 'Driver Accepted', 
          secondary: 'Driver is preparing your offer', 
          color: 'text-blue-600' 
        };
      case 'offer_sent':
        return { 
          primary: 'Offer Received', 
          secondary: 'Review and confirm your ride', 
          color: 'text-purple-600' 
        };
      case 'offer_accepted':
        return { 
          primary: 'Offer Accepted', 
          secondary: 'Please confirm your payment', 
          color: 'text-blue-600' 
        };
      case 'payment_confirmed':
        return { 
          primary: 'Payment Sent', 
          secondary: 'Waiting for driver confirmation', 
          color: 'text-green-600' 
        };
      case 'all_set':
        return { 
          primary: '✅ All Set!', 
          secondary: 'Your ride is confirmed and ready!', 
          color: 'text-emerald-600' 
        };
      default:
        return { 
          primary: 'Status Unknown', 
          secondary: '', 
          color: 'text-gray-600' 
        };
    }
  } else {
    // Driver perspective
    switch (status) {
      case 'pending':
        return { 
          primary: 'New Ride Request', 
          secondary: 'Please respond to the request', 
          color: 'text-orange-600' 
        };
      case 'driver_accepted':
        return { 
          primary: 'Accepted', 
          secondary: 'Send your price offer', 
          color: 'text-blue-600' 
        };
      case 'offer_sent':
        return { 
          primary: 'Offer Sent', 
          secondary: 'Waiting for passenger confirmation', 
          color: 'text-purple-600' 
        };
      case 'offer_accepted':
        return { 
          primary: 'Offer Accepted', 
          secondary: 'Waiting for payment', 
          color: 'text-blue-600' 
        };
      case 'payment_confirmed':
        return { 
          primary: 'Payment Received', 
          secondary: 'Confirm payment to complete', 
          color: 'text-green-600' 
        };
      case 'all_set':
        return { 
          primary: '✅ Ready to Go!', 
          secondary: 'Ride confirmed and ready', 
          color: 'text-emerald-600' 
        };
      default:
        return { 
          primary: 'Status Unknown', 
          secondary: '', 
          color: 'text-gray-600' 
        };
    }
  }
};

export const canReopenModal = (status: string): boolean => {
  // Allow reopening modals for interactive statuses
  return ['offer_sent', 'payment_confirmed'].includes(status);
};
