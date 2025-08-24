
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SplashScreen from "./pages/SplashScreen";
import OnboardingScreen from "./pages/OnboardingScreen";
import HomeScreen from "./pages/HomeScreen";
import PassengerDashboard from "./pages/passenger/Dashboard";
import DriverDashboard from "./pages/driver/Dashboard";
import DispatcherDashboard from "./pages/dispatcher/Dashboard";
import DriverLogin from "./pages/driver/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/splash" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/passenger/dashboard" element={<PassengerDashboard />} />
          <Route path="/passenger/login" element={<Index />} />
          <Route path="/passenger/booking" element={<Index />} />
          <Route path="/passenger/price-estimate" element={<Index />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/dispatcher/dashboard" element={<DispatcherDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
