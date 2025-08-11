
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SplashScreen from "./pages/SplashScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import HomeScreen from "./pages/HomeScreen";
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
            <Route path="/" element={<SplashScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/passenger/price-estimate" element={<PriceEstimate />} />
            <Route path="/passenger/login" element={<PassengerLogin />} />
            <Route path="/passenger/forgot-password" element={<ForgotPassword />} />
            <Route path="/passenger/choose-vehicle" element={<ChooseVehicle />} />
            <Route path="/passenger/booking-form" element={<BookingForm />} />
            <Route path="/passenger/confirmation" element={<Confirmation />} />
            <Route path="/passenger/dashboard" element={<PassengerDashboard />} />
            <Route path="/passenger/ride-progress" element={<PassengerRideProgress />} />
            <Route path="/dispatcher/dashboard" element={<DispatcherDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
