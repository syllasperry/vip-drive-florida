import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import HomePage from "@/pages/HomeScreen"
import { PricingPage } from "@/pages/Pricing"
import { ContactPage } from "@/pages/Contact"
import { AboutPage } from "@/pages/About"
import { TermsPage } from "@/pages/Terms"
import { PrivacyPage } from "@/pages/Privacy"
import PassengerLogin from "@/pages/passenger/Login"
import { PassengerSignup } from "@/pages/passenger/Signup"
import PassengerDashboard from "@/pages/passenger/Dashboard";
import DispatcherDashboard from "@/pages/dispatcher/Dashboard";
import DriverDashboard from "@/pages/driver/Dashboard";
import PriceEstimate from "@/pages/passenger/PriceEstimate";
import { SupportPage } from "@/pages/Support";
import DriverLogin from "@/pages/driver/Login";
import { DriverSignup } from "@/pages/driver/Signup";
import DispatcherLogin from "@/pages/dispatcher/Login";
import { DispatcherSignup } from "@/pages/dispatcher/Signup";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from "@/components/ui/toaster"
import CheckoutTestPage from "@/pages/test/Checkout";
import DiagnosticsPage from "@/pages/test/Diagnostics";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* Passenger Auth Routes */}
          <Route path="/passenger/login" element={<PassengerLogin />} />
          <Route path="/passenger/signup" element={<PassengerSignup />} />
          <Route path="/passenger/dashboard" element={<PassengerDashboard />} />
          <Route path="/passenger/price-estimate" element={<PriceEstimate />} />

          {/* Driver Auth Routes */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/signup" element={<DriverSignup />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />

          {/* Dispatcher Auth Routes */}
          <Route path="/dispatcher/login" element={<DispatcherLogin />} />
          <Route path="/dispatcher/signup" element={<DispatcherSignup />} />
          <Route path="/dispatcher/dashboard" element={<DispatcherDashboard />} />
          
          {/* Test Routes */}
          <Route path="/test/checkout" element={<CheckoutTestPage />} />
          <Route path="/test/diagnostics" element={<DiagnosticsPage />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;
