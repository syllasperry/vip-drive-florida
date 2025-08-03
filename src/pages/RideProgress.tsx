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
    console.log('RideProgress - Location state:', location.state);
    
    // Determine user type from location state or URL
    const userType = location.state?.userType || 'driver';
    const bookingData = location.state?.booking;
    
    console.log('RideProgress - User type:', userType);
    console.log('RideProgress - Booking data:', bookingData);
    
    setIsDriver(userType === 'driver');
    setBooking(bookingData);
    
    if (bookingData && bookingData.passenger_id) {
      fetchPassengerInfo(bookingData.passenger_id);
      updateStagesFromBooking(bookingData);
    } else {
      console.error('RideProgress - Missing booking data or passenger_id');
    }
  }, [location.state]);

  const fetchPassengerInfo = async (passengerId: string) => {
    try {
      console.log('RideProgress - Fetching passenger info for:', passengerId);
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', passengerId)
        .maybeSingle();
      
      if (error) {
        console.error('RideProgress - Error fetching passenger:', error);
        // Use fallback data if passenger not found
        setPassenger({
          id: passengerId,
          full_name: "Silas Pereira", 
          phone: "(561) 350-2308",
          profile_photo_url: "https://extdyjkfgftbokabiamc.supabase.co/storage/v1/object/public/avatars/74024418-9693-49f9-bddf-e34e59fc0cd4/74024418-9693-49f9-bddf-e34e59fc0cd4.jpg"
        });
      } else {
        console.log('RideProgress - Passenger data fetched:', data);
        setPassenger(data || {
          id: passengerId,
          full_name: "Silas Pereira", 
          phone: "(561) 350-2308",
          profile_photo_url: "https://extdyjkfgftbokabiamc.supabase.co/storage/v1/object/public/avatars/74024418-9693-49f9-bddf-e34e59fc0cd4/74024418-9693-49f9-bddf-e34e59fc0cd4.jpg"
        });
      }
    } catch (error) {
      console.error('RideProgress - Error fetching passenger info:', error);
      // Use fallback data
      setPassenger({
        id: passengerId,
        full_name: "Silas Pereira", 
        phone: "(561) 350-2308",
        profile_photo_url: "https://extdyjkfgftbokabiamc.supabase.co/storage/v1/object/public/avatars/74024418-9693-49f9-bddf-e34e59fc0cd4/74024418-9693-49f9-bddf-e34e59fc0cd4.jpg"
      });
    }
  };

  const updateStagesFromBooking = (bookingData: any) => {
    // Update stages based on current ride_stage from booking
    const currentStage = bookingData.ride_stage || 'driver_heading_to_pickup';
    const stageOrder = ['driver_heading_to_pickup', 'driver_arrived_at_pickup', 'passenger_onboard', 'in_transit', 'driver_arrived_at_dropoff', 'completed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    
    setRideStages(prev => prev.map((stage, index) => ({
      ...stage,
      completed: index <= currentIndex,
      timestamp: index <= currentIndex ? new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
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

      // Special handling for ride completion
      if (stageId === 'ride_completed' && checked) {
        const { error } = await supabase
          .from('bookings')
          .update({ 
            ride_stage: dbStage,
            status: 'completed',
            ride_status: 'completed',
            ride_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (error) throw error;
      } else {
        // Update booking in database
        const { error } = await supabase
          .from('bookings')
          .update({ 
            ride_stage: dbStage,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (error) throw error;
      }

      // Update local state - toggle individual stages independently
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      setRideStages(prev => prev.map(stage => {
        if (stage.id === stageId) {
          return { 
            ...stage, 
            completed: checked, 
            timestamp: checked ? timestamp : undefined 
          };
        }
        return stage;
      }));

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
        <div className="space-y-3">
          {rideStages.map((stage, index) => {
            const isInTransitWithStops = stage.id === 'in_transit' && stage.completed;
            
            return (
              <div key={stage.id} className="bg-card rounded-lg border">
                {/* Main status row */}
                <div className={`flex items-center justify-between p-4 ${
                  isInTransitWithStops ? 'bg-primary text-primary-foreground rounded-t-lg' : ''
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {isDriver ? (
                        <button
                          onClick={() => handleStageUpdate(stage.id, !stage.completed)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105 ${
                            stage.completed 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-muted-foreground hover:border-primary bg-background'
                          } ${isInTransitWithStops ? 'bg-background border-background text-primary' : ''}`}
                        >
                          {stage.completed && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ) : (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          stage.completed 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-muted-foreground bg-background'
                        } ${isInTransitWithStops ? 'bg-background border-background text-primary' : ''}`}>
                          {stage.completed && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isInTransitWithStops ? 'text-primary-foreground' : 
                        stage.completed ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {stage.title}
                      </p>
                    </div>
                  </div>
                  {stage.timestamp && (
                    <span className={`text-xs font-medium ${
                      isInTransitWithStops ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }`}>
                      {stage.timestamp}
                    </span>
                  )}
                </div>
                
                {/* Extra stop input for "In transit" stage */}
                {isInTransitWithStops && (
                  <div className="px-4 pb-4">
                    <Input
                      placeholder="Enter extra stop address"
                      value={extraStopLocation}
                      onChange={(e) => setExtraStopLocation(e.target.value)}
                      className="bg-background text-foreground border-border"
                      disabled={!isDriver}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Maps Navigation */}
        <div className="pt-6">
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleMapsClick('google')}
            >
              Google Maps
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleMapsClick('apple')}
            >
              Apple Maps
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleMapsClick('waze')}
            >
              Waze
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideProgress;