
import { useNavigate } from 'react-router-dom';

export const goToBooking = (bookingId: string) => {
  // For now, navigate back to the passenger dashboard
  // This can be updated later when we have a specific booking detail route
  window.location.href = '/passenger/dashboard';
};

export const useNavigation = () => {
  const navigate = useNavigate();
  
  return {
    goToBooking: (bookingId: string) => {
      navigate('/passenger/dashboard');
    },
    goToPassengerDashboard: () => {
      navigate('/passenger/dashboard');
    }
  };
};
