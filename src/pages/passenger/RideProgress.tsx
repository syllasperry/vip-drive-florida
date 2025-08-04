import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Phone, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { AddStopModal } from '@/components/ride/AddStopModal';

const PassengerRideProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [stageTimestamps, setStageTimestamps] = useState<Record<string, string>>({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [localExtraStops, setLocalExtraStops] = useState(booking?.extra_stops || []);
  const [rideStages, setRideStages] = useState([
    { id: 'heading_to_pickup', title: 'Driver heading to pickup', completed: false },
    { id: 'arrived_at_pickup', title: 'Driver arrived at pickup', completed: false },
    { id: 'passenger_onboard', title: 'Passenger onboard', completed: false },
    { id: 'in_transit', title: 'In transit with optional stops', completed: false },
    { id: 'arrived_at_dropoff', title: 'Driver arrived at drop-off location', completed: false },
    { id: 'ride_completed', title: 'Ride completed successfully', completed: false },
  ]);

  useEffect(() => {
    console.log('PassengerRideProgress - Location state:', location.state);
    
    const bookingData = location.state?.booking;
    console.log('PassengerRideProgress - Booking data:', bookingData);
    
    setBooking(bookingData);
    
    if (bookingData && bookingData.driver_id) {
      fetchDriverInfo(bookingData.driver_id);
      updateStagesFromBooking(bookingData);
      
      // Set up real-time subscription for booking updates
      const channel = supabase
        .channel('passenger-ride-progress')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'bookings',
            filter: `id=eq.${bookingData.id}`
          },
          (payload) => {
            console.log('Real-time booking update received by passenger:', payload);
            updateStagesFromBooking(payload.new);
            setBooking(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      console.error('PassengerRideProgress - Missing booking data or driver_id');
    }
  }, [location.state]);

  const fetchDriverInfo = async (driverId: string) => {
    try {
      console.log('PassengerRideProgress - Fetching driver info for:', driverId);
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .maybeSingle();
      
      if (error) {
        console.error('PassengerRideProgress - Error fetching driver:', error);
        // Use fallback data if driver not found
        setDriver({
          id: driverId,
          full_name: "Driver", 
          phone: "Contact Support",
          profile_photo_url: null
        });
      } else {
        console.log('PassengerRideProgress - Driver data fetched:', data);
        setDriver(data || {
          id: driverId,
          full_name: "Driver", 
          phone: "Contact Support",
          profile_photo_url: null
        });
      }
    } catch (error) {
      console.error('PassengerRideProgress - Error fetching driver info:', error);
      // Use fallback data
      setDriver({
        id: driverId,
        full_name: "Driver", 
        phone: "Contact Support",
        profile_photo_url: null
      });
    }
  };

  const updateStagesFromBooking = (bookingData: any) => {
    const currentStage = bookingData.ride_stage;
    const stageMapping: { [key: string]: string } = {
      'driver_heading_to_pickup': 'heading_to_pickup',
      'driver_arrived_at_pickup': 'arrived_at_pickup',
      'passenger_onboard': 'passenger_onboard',
      'in_transit': 'in_transit',
      'driver_arrived_at_dropoff': 'arrived_at_dropoff',
      'completed': 'ride_completed'
    };
    
    const mappedStageId = stageMapping[currentStage];
    
    // Set active stage and mark all previous stages as completed
    if (currentStage && mappedStageId) {
      setActiveStageId(mappedStageId);
      
      // Mark all stages up to and including current as completed
      const stageOrder = ['heading_to_pickup', 'arrived_at_pickup', 'passenger_onboard', 'in_transit', 'arrived_at_dropoff', 'ride_completed'];
      const currentIndex = stageOrder.indexOf(mappedStageId);
      
      // Update ride stages completion status
      setRideStages(prev => prev.map(stage => ({
        ...stage,
        completed: stageOrder.indexOf(stage.id) <= currentIndex
      })));
      
      // Only set timestamp if not already set (preserve original timestamps)
      setStageTimestamps(prev => ({
        ...prev,
        [mappedStageId]: prev[mappedStageId] || new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      }));
    } else {
      // Initial state - no active stage
      setActiveStageId(null);
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
    
    if (url) {
      window.open(url, '_blank');
      setIsMapModalOpen(false);
    }
  };

  if (!booking || !driver) {
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
        {/* Driver Info */}
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={driver.profile_photo_url} alt={driver.full_name} />
            <AvatarFallback>
              {driver.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{driver.full_name}</h2>
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-muted-foreground hover:text-primary"
              onClick={() => handlePhoneCall(driver.phone)}
            >
              <Phone className="h-4 w-4 mr-1" />
              {driver.phone}
            </Button>
          </div>
        </div>

        {/* Ride Status Timeline */}
        <div className="space-y-3">
          {rideStages.map((stage, index) => {
            const isCompleted = stage.completed;
            const isCurrentStage = activeStageId === stage.id;
            const timestamp = stageTimestamps[stage.id];
            const isInTransitWithStops = stage.id === 'in_transit' && isCurrentStage;
            
            return (
              <div key={stage.id} className="bg-card rounded-lg border">
                {/* Main status row */}
                <div className={`flex items-center justify-between p-4 ${
                  isInTransitWithStops ? 'bg-primary text-primary-foreground rounded-lg' : ''
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {/* Read-only status indicator for passenger */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
                          : 'border-muted-foreground bg-background'
                      } ${isInTransitWithStops ? 'bg-background border-background text-primary' : ''}`}>
                        {isCompleted && (
                          <svg className="w-4 h-4 font-bold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isInTransitWithStops ? 'text-primary-foreground' : 
                        isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {stage.title}
                      </p>
                    </div>
                  </div>
                  {timestamp && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                      isInTransitWithStops ? 'text-primary-foreground/80 bg-primary-foreground/10' : 'text-muted-foreground bg-muted/50'
                    }`}>
                      {timestamp}
                    </span>
                  )}
                </div>
                
                {/* Show extra stops info and add stop functionality */}
                {isInTransitWithStops && (
                  <div className="px-4 pb-4">
                    <div className="bg-background text-foreground border border-border rounded-md p-3">
                      {localExtraStops && localExtraStops.length > 0 ? (
                        <>
                          <p className="text-sm font-medium mb-2">Extra Stops:</p>
                          {localExtraStops.map((stop: any, index: number) => (
                            <p key={index} className="text-sm text-muted-foreground mb-1">
                              {index + 1}. {stop.address}
                            </p>
                          ))}
                        </>
                      ) : (
                        <p className="text-sm font-medium mb-2">Add optional stops along your route</p>
                      )}
                      <button 
                        onClick={() => setIsAddStopModalOpen(true)}
                        className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 px-3 rounded-md transition-colors"
                      >
                        + Add Stop
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Maps Navigation */}
        <div className="pt-8 flex justify-center">
          <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 font-medium text-base bg-background hover:bg-accent hover:text-accent-foreground border-2 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Map className="h-5 w-5 mr-2" />
                Maps
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Choose Maps App</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 font-medium text-base"
                  onClick={() => handleMapsClick('google')}
                >
                  Google Maps
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 font-medium text-base"
                  onClick={() => handleMapsClick('apple')}
                >
                  Apple Maps
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 font-medium text-base"
                  onClick={() => handleMapsClick('waze')}
                >
                  Waze
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Add Stop Modal */}
        <AddStopModal
          isOpen={isAddStopModalOpen}
          onClose={() => setIsAddStopModalOpen(false)}
          bookingId={booking?.id || ''}
          existingStops={localExtraStops}
          onStopsUpdated={(stops) => {
            setLocalExtraStops(stops);
            // Update the booking state as well
            if (booking) {
              setBooking({...booking, extra_stops: stops});
            }
          }}
        />
      </div>
    </div>
  );
};

export default PassengerRideProgress;