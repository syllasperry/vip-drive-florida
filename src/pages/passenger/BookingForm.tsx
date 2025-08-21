
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchMyPassengerProfile } from '@/lib/passenger/profile';
import { usePassengerAuth } from '@/hooks/usePassengerAuth';

const BookingForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = usePassengerAuth();
  const [loading, setLoading] = useState(false);
  const [passengerId, setPassengerId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    passengerCount: '1',
    luggageCount: '0',
    vehicleType: '',
    flightInfo: '',
    specialRequests: ''
  });

  // Get passenger profile on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/passenger/login');
      return;
    }

    const loadPassengerProfile = async () => {
      try {
        const profile = await fetchMyPassengerProfile();
        if (profile?.id) {
          setPassengerId(profile.id);
        } else {
          toast({
            title: "Profile Required",
            description: "Please complete your profile before booking.",
            variant: "destructive",
          });
          navigate('/passenger/dashboard');
        }
      } catch (error) {
        console.error('Error loading passenger profile:', error);
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadPassengerProfile();
  }, [isAuthenticated, navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !passengerId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a booking.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.pickupLocation || !formData.dropoffLocation || !formData.pickupDate || !formData.pickupTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time for pickup_time
      const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      
      const bookingData = {
        passenger_id: passengerId,
        pickup_location: formData.pickupLocation,
        dropoff_location: formData.dropoffLocation,
        pickup_time: pickupDateTime.toISOString(),
        passenger_count: parseInt(formData.passengerCount),
        luggage_count: parseInt(formData.luggageCount),
        vehicle_type: formData.vehicleType || 'Standard Sedan',
        flight_info: formData.flightInfo,
        status: 'pending',
        payment_status: 'pending'
      };

      console.log('Creating booking with data:', bookingData);

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }

      console.log('✅ Booking created successfully:', data);

      toast({
        title: "Booking Created!",
        description: "Your ride has been requested successfully.",
      });

      // Navigate to confirmation page or dashboard
      navigate('/passenger/dashboard');

    } catch (error: any) {
      console.error('❌ Error creating booking:', error);
      
      let errorMessage = "Failed to create booking. Please try again.";
      
      if (error.message?.includes('violates row-level security')) {
        errorMessage = "Authentication error. Please log out and log back in.";
      } else if (error.message?.includes('passenger_id')) {
        errorMessage = "Profile error. Please complete your profile first.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const vehicleOptions = [
    { value: 'Standard Sedan', label: 'Standard Sedan' },
    { value: 'Luxury Sedan', label: 'Luxury Sedan' },
    { value: 'SUV', label: 'SUV' },
    { value: 'Premium SUV', label: 'Premium SUV' },
    { value: 'Van', label: 'Van' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Book Your Ride
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Fields */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="pickup">Pickup Location *</Label>
                  <Input
                    id="pickup"
                    value={formData.pickupLocation}
                    onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                    placeholder="Enter pickup address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dropoff">Drop-off Location *</Label>
                  <Input
                    id="dropoff"
                    value={formData.dropoffLocation}
                    onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
                    placeholder="Enter destination address"
                    required
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Pickup Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.pickupDate}
                    onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Pickup Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.pickupTime}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Passenger and Luggage Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passengers">Passengers</Label>
                  <Select value={formData.passengerCount} onValueChange={(value) => handleInputChange('passengerCount', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Passenger' : 'Passengers'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="luggage">Luggage Items</Label>
                  <Select value={formData.luggageCount} onValueChange={(value) => handleInputChange('luggageCount', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Bag' : 'Bags'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle Type */}
              <div>
                <Label htmlFor="vehicle">Vehicle Type</Label>
                <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flight Info */}
              <div>
                <Label htmlFor="flight">Flight Information (Optional)</Label>
                <Input
                  id="flight"
                  value={formData.flightInfo}
                  onChange={(e) => handleInputChange('flightInfo', e.target.value)}
                  placeholder="Flight number (e.g., AA123)"
                />
              </div>

              {/* Special Requests */}
              <div>
                <Label htmlFor="requests">Special Requests (Optional)</Label>
                <Textarea
                  id="requests"
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  placeholder="Any special requirements or notes"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/passenger/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  {loading ? 'Creating...' : 'Book Ride'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingForm;
