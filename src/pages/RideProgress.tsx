import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Car, Clock, CheckCircle, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface RideStage {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

const RideProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState<'driver' | 'passenger'>('passenger');
  const [showMapsDialog, setShowMapsDialog] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);

  // Hardcoded data for the specific ride (as requested by user)
  const rideData = {
    passenger: {
      fullName: "Silas Pereira",
      phone: "(561) 350-2308",
      profilePhotoUrl: "https://extdyjkfgftbokabiamc.supabase.co/storage/v1/object/public/avatars/74024418-9693-49f9-bddf-e34e59fc0cd4/74024418-9693-49f9-bddf-e34e59fc0cd4.jpg"
    },
    ride: {
      pickupLocation: "2100 NW 42nd Ave, Miami, FL 33142, USA",
      dropoffLocation: "2911 NE 1st Ave, Pompano Beach, FL 33064, USA",
      pickupTime: "August 6, 2025 – 07:00 AM",
      vehicle: "Tesla Model Y – Silver",
      fare: "$120 USD",
      currentStage: "driver_heading_to_pickup"
    }
  };

  const [rideStages, setRideStages] = useState<RideStage[]>([
    {
      id: 'driver_heading_to_pickup',
      title: 'Driver heading to pickup',
      icon: Navigation,
      timestamp: '07:11',
      isCompleted: true,
      isCurrent: false
    },
    {
      id: 'driver_arrived_at_pickup',
      title: 'Driver arrived at pickup',
      icon: MapPin,
      timestamp: '07:41',
      isCompleted: true,
      isCurrent: false
    },
    {
      id: 'passenger_onboard',
      title: 'Passenger onboard',
      icon: Car,
      timestamp: '07:44',
      isCompleted: true,
      isCurrent: true
    },
    {
      id: 'in_transit',
      title: 'In transit with optional stops',
      icon: Navigation,
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'driver_arrived_at_dropoff',
      title: 'Driver arrived at drop-off location',
      icon: MapPin,
      isCompleted: false,
      isCurrent: false
    },
    {
      id: 'completed',
      title: 'Ride completed successfully',
      icon: CheckCircle,
      isCompleted: false,
      isCurrent: false
    }
  ]);

  useEffect(() => {
    // Determine user type from URL or current route
    const currentPath = location.pathname;
    if (currentPath.includes('/driver/')) {
      setUserType('driver');
    } else {
      setUserType('passenger');
    }
  }, [location]);

  const handlePhoneCall = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.open(`tel:+1${cleanPhone}`, '_self');
  };

  const handleMapsClick = (mapType: string) => {
    const pickup = encodeURIComponent(rideData.ride.pickupLocation);
    const dropoff = encodeURIComponent(rideData.ride.dropoffLocation);
    
    let url = '';
    switch (mapType) {
      case 'google':
        url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}&dirflg=d`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${pickup}&navigate=yes&to=${dropoff}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      setShowMapsDialog(false);
    }
  };

  const handleStageUpdate = (stageId: string) => {
    if (userType === 'driver') {
      setRideStages(prev => prev.map(stage => {
        if (stage.id === stageId) {
          return { 
            ...stage, 
            isCompleted: true, 
            isCurrent: false,
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })
          };
        }
        return stage;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/50 p-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Ride Progress</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Passenger Info Section */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={rideData.passenger.profilePhotoUrl} />
              <AvatarFallback>
                {rideData.passenger.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{rideData.passenger.fullName}</h2>
              <button 
                onClick={() => handlePhoneCall(rideData.passenger.phone)}
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Phone className="h-4 w-4" />
                {rideData.passenger.phone}
              </button>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pickup Time</span>
              <span className="font-medium">{rideData.ride.pickupTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vehicle</span>
              <span className="font-medium">{rideData.ride.vehicle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Fare</span>
              <span className="font-bold text-lg">{rideData.ride.fare}</span>
            </div>
          </div>
        </Card>

        {/* Ride Status Timeline */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Ride Status</h3>
          
          <div className="space-y-4">
            {rideStages.map((stage, index) => {
              const Icon = stage.icon;
              const isLast = index === rideStages.length - 1;
              
              return (
                <div key={stage.id} className="flex items-start gap-4">
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      stage.isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : stage.isCurrent
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 mt-2 transition-all ${
                        stage.isCompleted ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </div>
                  
                  {/* Timeline Content */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        stage.isCompleted 
                          ? 'text-foreground' 
                          : stage.isCurrent
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}>
                        {stage.title}
                      </h4>
                      {stage.timestamp && (
                        <span className="text-sm text-muted-foreground">
                          {stage.timestamp}
                        </span>
                      )}
                    </div>
                    
                    {userType === 'driver' && stage.isCurrent && (
                      <Button 
                        onClick={() => handleStageUpdate(stage.id)}
                        size="sm" 
                        className="mt-2"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Locations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Trip Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p className="font-medium">{rideData.ride.pickupLocation}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-2" />
              <div>
                <p className="text-sm text-muted-foreground">Drop-off</p>
                <p className="font-medium">{rideData.ride.dropoffLocation}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Maps Button */}
        <Button 
          onClick={() => setShowMapsDialog(true)}
          className="w-full h-14 text-lg font-semibold bg-black hover:bg-black/90 text-white"
        >
          Maps
        </Button>
      </div>

      {/* Maps Selection Dialog */}
      <Dialog open={showMapsDialog} onOpenChange={setShowMapsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Navigation App</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
              onClick={() => handleMapsClick('google')}
            >
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm font-bold">
                G
              </div>
              <span className="text-sm">Google Maps</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
              onClick={() => handleMapsClick('apple')}
            >
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white text-sm font-bold">
                🍎
              </div>
              <span className="text-sm">Apple Maps</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
              onClick={() => handleMapsClick('waze')}
            >
              <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center text-white text-sm font-bold">
                W
              </div>
              <span className="text-sm">Waze</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RideProgress;