
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import HomeScreen from './HomeScreen';
import PassengerLogin from './passenger/Login';
import PassengerDashboard from './passenger/Dashboard';
import PassengerBookingForm from './passenger/BookingForm';
import PassengerPriceEstimate from './passenger/PriceEstimate';
import PassengerChooseVehicle from './passenger/ChooseVehicle';
import PassengerConfirmation from './passenger/Confirmation';
import PassengerRideProgress from './passenger/RideProgress';
import PassengerForgotPassword from './passenger/ForgotPassword';
import DriverLogin from './driver/Login';
import DriverRegister from './driver/Register';
import DriverDashboard from './driver/Dashboard';
import DriverRideProgressScreen from './driver/RideProgressScreen';
import DriverToDoPage from './driver/ToDoPage';
import DispatcherDashboard from './dispatcher/Dashboard';
import PaymentSuccess from './payment/Success';
import PaymentCancel from './payment/Cancel';
import NotFound from './NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            
            {/* Passenger Routes */}
            <Route path="/passenger/login" element={<PassengerLogin />} />
            <Route path="/passenger/dashboard" element={<PassengerDashboard />} />
            <Route path="/passenger/booking-form" element={<PassengerBookingForm />} />
            <Route path="/passenger/price-estimate" element={<PassengerPriceEstimate />} />
            <Route path="/passenger/choose-vehicle" element={<PassengerChooseVehicle />} />
            <Route path="/passenger/confirmation" element={<PassengerConfirmation />} />
            <Route path="/passenger/ride-progress" element={<PassengerRideProgress />} />
            <Route path="/passenger/forgot-password" element={<PassengerForgotPassword />} />
            
            {/* Driver Routes */}
            <Route path="/driver/login" element={<DriverLogin />} />
            <Route path="/driver/register" element={<DriverRegister />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            <Route path="/driver/ride-progress" element={<DriverRideProgressScreen />} />
            <Route path="/driver/todo" element={<DriverToDoPage />} />
            
            {/* Dispatcher Routes */}
            <Route path="/dispatcher/dashboard" element={<DispatcherDashboard />} />
            
            {/* Payment Routes */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
