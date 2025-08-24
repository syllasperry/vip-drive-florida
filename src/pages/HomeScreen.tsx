
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Users, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const navigate = useNavigate();

  const handleBookNow = () => {
    navigate('/passenger/price-estimate');
  };

  const handleDriverLogin = () => {
    navigate('/driver/login');
  };

  const handleDispatcherLogin = () => {
    navigate('/dispatcher/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">VIP</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Transportation</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleDriverLogin}>
                Driver Portal
              </Button>
              <Button variant="outline" onClick={handleDispatcherLogin}>
                Dispatcher
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Premium Transportation
            <span className="text-red-600 block">At Your Service</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience luxury travel with our professional chauffeur service. 
            From airport transfers to business meetings, we ensure you arrive in style and comfort.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button 
              size="lg" 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
              onClick={handleBookNow}
            >
              Book Your Ride Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-4 text-lg"
              onClick={() => navigate('/passenger/login')}
            >
              Passenger Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose VIP Transportation?</h2>
            <p className="text-lg text-gray-600">Experience the difference with our premium service</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Premium Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Luxury sedans, SUVs, and executive vans maintained to the highest standards
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Professional Chauffeurs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Experienced, licensed, and background-checked drivers committed to excellence
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Safe & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Comprehensive insurance coverage and real-time tracking for your peace of mind
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">24/7 Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Round-the-clock availability for all your transportation needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience VIP Service?</h2>
          <p className="text-xl text-red-100 mb-8">
            Book your premium ride today and discover the VIP difference
          </p>
          <Button 
            size="lg" 
            className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            onClick={handleBookNow}
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">VIP</span>
            </div>
            <span className="text-xl font-semibold">Transportation</span>
          </div>
          <p className="text-gray-400">© 2024 VIP Transportation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomeScreen;
