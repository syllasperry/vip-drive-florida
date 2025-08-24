
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const onboardingSlides = [
  {
    id: 1,
    image: '/src/assets/onboarding-woman-booking.jpg',
    title: 'Book Your Perfect Ride',
    subtitle: 'Quick and easy booking process',
    description: 'Schedule your premium transportation with just a few taps. Choose from luxury sedans, SUVs, or executive vans.'
  },
  {
    id: 2,
    image: '/src/assets/onboarding-chauffeur-welcome.jpg', 
    title: 'Professional Chauffeurs',
    subtitle: 'Experienced and courteous drivers',
    description: 'Our vetted professional chauffeurs provide exceptional service with attention to every detail of your journey.'
  },
  {
    id: 3,
    image: '/src/assets/onboarding-businessman.jpg',
    title: 'Arrive in Style',
    subtitle: 'Premium vehicles for every occasion',
    description: 'Whether for business or leisure, travel in comfort with our fleet of premium vehicles and personalized service.'
  }
];

const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % onboardingSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + onboardingSlides.length) % onboardingSlides.length);
  };

  const handleGetStarted = () => {
    navigate('/home');
  };

  const handleSkip = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="w-16 h-8 bg-red-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">VIP</span>
        </div>
        <Button variant="ghost" onClick={handleSkip} className="text-gray-600">
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            {/* Image */}
            <div className="mb-8">
              <div className="w-64 h-48 mx-auto bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={onboardingSlides[currentSlide].image}
                  alt={onboardingSlides[currentSlide].title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,${btoa(`
                      <svg width="256" height="192" xmlns="http://www.w3.org/2000/svg">
                        <rect width="256" height="192" fill="#e5e7eb"/>
                        <text x="128" y="96" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
                          ${onboardingSlides[currentSlide].title}
                        </text>
                      </svg>
                    `)}`;
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {onboardingSlides[currentSlide].title}
                </h1>
                <p className="text-lg text-red-600 font-medium mb-3">
                  {onboardingSlides[currentSlide].subtitle}
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {onboardingSlides[currentSlide].description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Slide Indicators */}
        <div className="flex space-x-2 mt-8">
          {onboardingSlides.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-red-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center w-full max-w-md mt-8">
          <Button
            variant="outline"
            onClick={prevSlide}
            className="flex items-center gap-2"
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentSlide === onboardingSlides.length - 1 ? (
            <Button
              onClick={handleGetStarted}
              className="bg-red-600 hover:bg-red-700 text-white px-8"
            >
              Get Started
            </Button>
          ) : (
            <Button
              onClick={nextSlide}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
