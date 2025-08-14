
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import PriceEstimate from "./pages/passenger/PriceEstimate";
import PassengerLogin from "./pages/passenger/Login";
import ForgotPassword from "./pages/passenger/ForgotPassword";
import ChooseVehicle from "./pages/passenger/ChooseVehicle";
import BookingForm from "./pages/passenger/BookingForm";
import Confirmation from "./pages/passenger/Confirmation";
import PassengerDashboard from "./pages/passenger/Dashboard";
import PassengerRideProgress from "./pages/passenger/RideProgress";
import DispatcherDashboard from "./pages/dispatcher/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* App starts with animated logo presentation */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            
            {/* Booking flow - consolidated routes */}
            <Route path="/estimate" element={<PriceEstimate />} />
            <Route path="/get-started" element={<PriceEstimate />} />
            <Route path="/passenger/price-estimate" element={<PriceEstimate />} />
            <Route path="/cars" element={<ChooseVehicle />} />
            <Route path="/passenger/choose-vehicle" element={<ChooseVehicle />} />
            <Route path="/booking/details" element={<BookingForm />} />
            <Route path="/passenger/booking-form" element={<BookingForm />} />
            <Route path="/booking/confirm" element={<Confirmation />} />
            <Route path="/passenger/confirmation" element={<Confirmation />} />
            
            {/* Auth */}
            <Route path="/passenger/login" element={<PassengerLogin />} />
            <Route path="/passenger/forgot-password" element={<ForgotPassword />} />
            
            {/* Dashboards */}
            <Route path="/passenger/dashboard" element={<PassengerDashboard />} />
            <Route path="/passenger/ride-progress" element={<PassengerRideProgress />} />
            <Route path="/dispatcher/dashboard" element={<DispatcherDashboard />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
