import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, Luggage, Plane, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/DateTimePicker";

const BookingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pickup, dropoff, selectedVehicle } = location.state || {};

  const [formData, setFormData] = useState({
    flightInfo: "",
    date: "",
    time: "",
    passengers: "1",
    luggage: "1",
    luggageSize: "medium",
    notes: "",
    bookingForOther: false,
    otherPersonName: "",
    otherPersonPhone: "",
    otherPersonEmail: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to confirmation page
    navigate("/passenger/confirmation", {
      state: {
        pickup,
        dropoff,
        selectedVehicle,
        bookingDetails: formData
      }
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGoBack = () => {
    navigate("/passenger/choose-vehicle", { 
      state: { pickup, dropoff } 
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Go Back button */}
        <div className="flex justify-start mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Booking</h1>
          <p className="text-muted-foreground">Fill in the details for your ride</p>
        </div>

        {selectedVehicle && (
          <div className="bg-card rounded-xl p-6 mb-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <img 
                src={selectedVehicle.image} 
                alt={selectedVehicle.name}
                className="w-20 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-bold text-card-foreground">{selectedVehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedVehicle.description}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-xl p-6 shadow-lg space-y-6">
            <h2 className="text-xl font-bold text-card-foreground flex items-center">
              <Plane className="mr-2 h-5 w-5 text-primary" />
              Trip Details
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="flightInfo" className="text-card-foreground">
                  Flight Information (Optional)
                </Label>
                <Input
                  id="flightInfo"
                  placeholder="e.g., AA123 arriving at 3:00 PM"
                  value={formData.flightInfo}
                  onChange={(e) => handleInputChange("flightInfo", e.target.value)}
                  className="mt-1"
                />
              </div>

              <DateTimePicker
                selectedDate={formData.date}
                selectedTime={formData.time}
                onDateChange={(date) => handleInputChange("date", date)}
                onTimeChange={(time) => handleInputChange("time", time)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passengers" className="text-card-foreground flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    Passengers
                  </Label>
                  <Select value={formData.passengers} onValueChange={(value) => handleInputChange("passengers", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="luggage" className="text-card-foreground flex items-center">
                    <Luggage className="mr-1 h-4 w-4" />
                    Luggage Count
                  </Label>
                  <Select value={formData.luggage} onValueChange={(value) => handleInputChange("luggage", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0,1,2,3,4,5,6,7,8].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="luggageSize" className="text-card-foreground">
                  Luggage Size
                </Label>
                <Select value={formData.luggageSize} onValueChange={(value) => handleInputChange("luggageSize", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (carry-on)</SelectItem>
                    <SelectItem value="medium">Medium (standard)</SelectItem>
                    <SelectItem value="large">Large (oversized)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-card-foreground">
                  Special Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="bookingForOther" className="text-card-foreground font-medium">
                Booking for another person?
              </Label>
              <Switch
                id="bookingForOther"
                checked={formData.bookingForOther}
                onCheckedChange={(checked) => handleInputChange("bookingForOther", checked)}
              />
            </div>

            {formData.bookingForOther && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <Label htmlFor="otherPersonName" className="text-card-foreground">
                    Passenger Name
                  </Label>
                  <Input
                    id="otherPersonName"
                    placeholder="Full name of the passenger"
                    value={formData.otherPersonName}
                    onChange={(e) => handleInputChange("otherPersonName", e.target.value)}
                    className="mt-1"
                    required={formData.bookingForOther}
                  />
                </div>
                <div>
                  <Label htmlFor="otherPersonPhone" className="text-card-foreground">
                    Passenger Phone
                  </Label>
                  <Input
                    id="otherPersonPhone"
                    placeholder="Phone number"
                    value={formData.otherPersonPhone}
                    onChange={(e) => handleInputChange("otherPersonPhone", e.target.value)}
                    className="mt-1"
                    required={formData.bookingForOther}
                  />
                </div>
                <div>
                  <Label htmlFor="otherPersonEmail" className="text-card-foreground">
                    Passenger Email
                  </Label>
                  <Input
                    id="otherPersonEmail"
                    type="email"
                    placeholder="Email address"
                    value={formData.otherPersonEmail}
                    onChange={(e) => handleInputChange("otherPersonEmail", e.target.value)}
                    className="mt-1"
                    required={formData.bookingForOther}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="luxury"
            size="lg"
            className="w-full"
            disabled={!formData.date || !formData.time}
          >
            Submit Booking Request
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Your booking request will be sent to available drivers
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;