
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Star, Shield } from 'lucide-react';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MapPin className="h-8 w-8 text-red-500" />,
      title: "Airport Transfers",
      description: "Professional service to all major South Florida airports"
    },
    {
      icon: <Clock className="h-8 w-8 text-red-500" />,
      title: "Always On Time",
      description: "Punctual service with real-time tracking and updates"
    },
    {
      icon: <Star className="h-8 w-8 text-red-500" />,
      title: "Premium Experience",
      description: "Luxury vehicles with professional chauffeurs"
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Safe & Reliable",
      description: "Insured, licensed drivers with excellent safety records"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="text-center max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">
              VIP Chauffeur Service
            </h1>
            <p className="text-xl mb-8 text-red-100">
              Premium transportation for discerning clients throughout South Florida
            </p>
            <Button 
              onClick={() => navigate('/onboarding')}
              size="lg"
              className="bg-white text-red-600 hover:bg-red-50 text-lg px-8 py-3"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Why Choose VIP Chauffeur?
            </h2>
            <p className="text-muted-foreground text-lg">
              Experience the difference of premium transportation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-card shadow-sm">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Experience Premium Transportation?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Book your ride in just a few minutes and enjoy the VIP treatment
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button 
              onClick={() => navigate('/estimate')}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Get Price Estimate
            </Button>
            <Button 
              onClick={() => navigate('/passenger/login')}
              variant="outline"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
