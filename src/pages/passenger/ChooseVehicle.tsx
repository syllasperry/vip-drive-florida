
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Luggage, Star, Wifi, Snowflake } from 'lucide-react';

interface VehicleOption {
  id: string;
  name: string;
  category: string;
  image: string;
  capacity: number;
  luggage: number;
  features: string[];
  priceMultiplier: number;
  description: string;
}

const vehicles: VehicleOption[] = [
  {
    id: 'tesla-model-y',
    name: 'Tesla Model Y',
    category: 'Electric',
    image: '/lovable-uploads/7a2edd95-6e8c-458a-a3a5-93441bc2ad44.png',
    capacity: 4,
    luggage: 3,
    features: ['Wi-Fi', 'Climate Control', 'Premium Audio', 'Auto Pilot'],
    priceMultiplier: 0.9,
    description: 'Premium electric vehicle with advanced features'
  },
  {
    id: 'premium-sedan',
    name: 'BMW 5 Series',
    category: 'Sedan',
    image: '/lovable-uploads/c9d111f3-4cc2-4c9a-956e-e5238177f67c.png',
    capacity: 4,
    luggage: 2,
    features: ['Wi-Fi', 'Climate Control', 'Premium Audio', 'Phone Charger'],
    priceMultiplier: 1.0,
    description: 'Luxury sedan with sophisticated comfort'
  },
  {
    id: 'luxury-suv',
    name: 'Chevrolet Tahoe', 
    category: 'SUV',
    image: '/lovable-uploads/e3743181-33d0-48f2-b3a5-922b77ffe0c9.png',
    capacity: 7,
    luggage: 5,
    features: ['Wi-Fi', 'Climate Control', 'Premium Audio', 'Extra Space'],
    priceMultiplier: 1.2,
    description: 'Spacious SUV perfect for groups and families'
  },
  {
    id: 'executive-van',
    name: 'Mercedes-Benz Sprinter',
    category: 'Van',
    image: '/lovable-uploads/3f28aecb-9019-4ca7-b1ca-54367debfe00.png',
    capacity: 8,
    luggage: 8,
    features: ['Wi-Fi', 'Climate Control', 'Premium Audio', 'Maximum Space'],
    priceMultiplier: 1.5,
    description: 'Premium van for large groups'
  }
];

const ChooseVehicle: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pickup, dropoff, estimatedPrice } = location.state || {};
  
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);

  const handleContinue = () => {
    if (!selectedVehicle) return;
    
    navigate('/passenger/booking-form', {
      state: {
        pickup,
        dropoff,
        estimatedPrice,
        selectedVehicle
      }
    });
  };

  const calculatePrice = (basePrice: string, multiplier: number) => {
    const price = parseInt(basePrice.replace('$', ''));
    return `$${Math.round(price * multiplier)}`;
  };

  if (!pickup || !dropoff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No trip information found</h2>
          <Button onClick={() => navigate('/estimate')}>Start New Booking</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Price Estimate
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Vehicle</h1>
          <p className="text-gray-600">Select the perfect vehicle for your journey</p>
        </div>

        {/* Trip Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-900">From:</p>
                <p className="text-gray-600">{pickup}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">To:</p>
                <p className="text-gray-600">{dropoff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedVehicle?.id === vehicle.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <CardContent className="p-6">
                <div className="aspect-[16/10] mb-4 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhciBJbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.name}</h3>
                    <Badge variant="secondary">{vehicle.category}</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">{vehicle.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{vehicle.capacity} seats</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Luggage className="h-4 w-4" />
                      <span>{vehicle.luggage} bags</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {vehicle.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {estimatedPrice && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estimated Price:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {calculatePrice(estimatedPrice, vehicle.priceMultiplier)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedVehicle}
            className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-lg"
            size="lg"
          >
            {selectedVehicle ? `Continue with ${selectedVehicle.name}` : 'Select a vehicle to continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChooseVehicle;
