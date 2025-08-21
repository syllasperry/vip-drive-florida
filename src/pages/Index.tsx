
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import OnboardingScreen from './OnboardingScreen';
import HomeScreen from './HomeScreen';
import NotFound from './NotFound';

// Passenger pages
import PassengerLogin from './passenger/Login';
import ForgotPassword from './passenger/ForgotPassword';
import BookingForm from './passenger/BookingForm';
import ChooseVehicle from './passenger/ChooseVehicle';
import PriceEstimate from './passenger/PriceEstimate';
import Confirmation from './passenger/Confirmation';
import PassengerDashboard from './passenger/Dashboard';
import PassengerRideProgress from './passenger/RideProgress';

// Payment pages
import PaymentSuccess from './payment/Success';
import PaymentCancel from './payment/Cancel';

// Driver pages
import DriverLogin from './driver/Login';
import DriverRegister from './driver/Register';
import DriverDashboard from './driver/Dashboard';
import ToDoPage from './driver/ToDoPage';
import { RideProgressScreen } from './driver/RideProgressScreen';


const Index = () => {
  return (
    <Router>
      <Routes>
        {/* Initial flow */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        
        {/* Passenger routes */}
        <Route path="/passenger/login" element={<PassengerLogin />} />
        <Route path="/passenger/forgot-password" element={<ForgotPassword />} />
        <Route path="/passenger/booking" element={<BookingForm />} />
        <Route path="/passenger/choose-vehicle" element={<ChooseVehicle />} />
        <Route path="/passenger/price-estimate" element={<PriceEstimate />} />
        <Route path="/passenger/confirmation" element={<Confirmation />} />
        <Route path="/passenger/dashboard" element={<PassengerDashboard />} />
        <Route path="/passenger/ride-progress" element={<PassengerRideProgress />} />
        
        {/* Payment routes */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        
        {/* Driver routes */}
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/todo" element={<ToDoPage />} />
        <Route path="/driver/ride-progress" element={<RideProgressScreen />} />
        
        {/* Shared routes */}
        <Route path="/ride-progress" element={<RideProgressScreen />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default Index;
