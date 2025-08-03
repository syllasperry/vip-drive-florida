import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

interface RideStage {
  id: string;
  title: string;
  completed: boolean;
  timestamp?: string;
}

const RideProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDriver, setIsDriver] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [passenger, setPassenger] = useState<any>(null);
  const [extraStopLocation, setExtraStopLocation] = useState('');
  const [rideStages, setRideStages] = useState<RideStage[]>([
    { id: 'heading_to_pickup', title: 'Driver heading to pickup', completed: false },
    { id: 'arrived_at_pickup', title: 'Driver arrived at pickup', completed: false },
    { id: 'passenger_onboard', title: 'Passenger onboard', completed: false },
    { id: 'in_transit', title: 'In transit with optional stops', completed: false },
    { id: 'arrived_at_dropoff', title: 'Driver arrived at drop-off location', completed: false },
    { id: 'ride_completed', title: 'Ride completed successfully', completed: false },
  ]);

  useEffect(() => {
    // Determine user type from location state or URL
    const userType = location.state?.userType || 'driver';
    const bookingData = location.state?.booking;
    
    setIsDriver(userType === 'driver');
    setBooking(bookingData);
    
    if (bookingData) {
      fetchPassengerInfo(bookingData.passenger_id);
      updateStagesFromBooking(bookingData);
    }
  }, [location.state]);

  const fetchPassengerInfo = async (passengerId: string) => {
    try {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', passengerId)
        .single();
      
      if (error) throw error;
      setPassenger(data);
    } catch (error) {
      console.error('Error fetching passenger info:', error);
    }
  };

  const updateStagesFromBooking = (bookingData: any) => {
    // Update stages based on current ride_stage from booking
    const currentStage = bookingData.ride_stage;
    const stageOrder = ['driver_heading_to_pickup', 'driver_arrived_at_pickup', 'passenger_onboard', 'in_transit', 'driver_arrived_at_dropoff', 'completed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    
    setRideStages(prev => prev.map((stage, index) => ({
      ...stage,
      completed: index <= currentIndex,
      timestamp: index <= currentIndex ? new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : undefined
    })));
  };

  const handleStageUpdate = async (stageId: string, checked: boolean) => {
    if (!isDriver || !booking) return;

    try {
      // Map stage IDs to database values
      const stageMapping: { [key: string]: string } = {
        'heading_to_pickup': 'driver_heading_to_pickup',
        'arrived_at_pickup': 'driver_arrived_at_pickup', 
        'passenger_onboard': 'passenger_onboard',
        'in_transit': 'in_transit',
        'arrived_at_dropoff': 'driver_arrived_at_dropoff',
        'ride_completed': 'completed'
      };

      const dbStage = stageMapping[stageId];
      if (!dbStage) return;

      // Update booking in database
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_stage: dbStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Update local state
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });

      setRideStages(prev => prev.map(stage => 
        stage.id === stageId 
          ? { ...stage, completed: checked, timestamp: checked ? timestamp : undefined }
          : stage
      ));

    } catch (error) {
      console.error('Error updating ride stage:', error);
    }
  };

  const handlePhoneCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMapsClick = (mapType: string) => {
    const pickup = encodeURIComponent(booking?.pickup_location || '');
    const dropoff = encodeURIComponent(booking?.dropoff_location || '');
    
    let url = '';
    switch (mapType) {
      case 'google':
        url = `https://www.google.com/maps/dir/${pickup}/${dropoff}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?saddr=${pickup}&daddr=${dropoff}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?q=${dropoff}&navigate=yes`;
        break;
    }
    
    if (url) window.open(url, '_blank');
  };

  if (!booking || !passenger) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading ride details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Ride Progress</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Passenger Info */}
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={passenger.profile_photo_url} alt={passenger.full_name} />
            <AvatarFallback>
              {passenger.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{passenger.full_name}</h2>
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-muted-foreground hover:text-primary"
              onClick={() => handlePhoneCall(passenger.phone)}
            >
              <Phone className="h-4 w-4 mr-1" />
              {passenger.phone}
            </Button>
          </div>
        </div>

        {/* Ride Status Timeline */}
        <div className="space-y-4">
          {rideStages.map((stage, index) => (
            <div key={stage.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {isDriver ? (
                  <Checkbox
                    checked={stage.completed}
                    onCheckedChange={(checked) => handleStageUpdate(stage.id, checked as boolean)}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    stage.completed 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/20'
                  }`}>
                    {stage.completed && (
                      <div className="w-3 h-3 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${
                    stage.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {stage.title}
                  </p>
                  {stage.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {stage.timestamp}
                    </span>
                  )}
                </div>
                
                {/* Extra stop input for "In transit" stage */}
                {stage.id === 'in_transit' && stage.completed && (
                  <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <Input
                      placeholder="Enter address"
                      value={extraStopLocation}
                      onChange={(e) => setExtraStopLocation(e.target.value)}
                      className="bg-background"
                      disabled={!isDriver}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Maps Navigation */}
        <div className="pt-6">
          <div className="flex justify-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              className="w-16 h-16 rounded-full"
              onClick={() => handleMapsClick('google')}
            >
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-16 h-16 rounded-full"
              onClick={() => handleMapsClick('apple')}
            >
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                <span className="text-white text-lg">🍎</span>
              </div>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-16 h-16 rounded-full"
              onClick={() => handleMapsClick('waze')}
            >
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
            </Button>
          </div>
          
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => handleMapsClick('google')}
          >
            Open in Maps
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RideProgress;