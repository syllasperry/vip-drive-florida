
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Phone, Mail, Car } from "lucide-react";

export const DriverManagement = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    full_name: '',
    email: '',
    phone: '',
    car_make: '',
    car_model: '',
    car_year: '',
    car_color: '',
    license_plate: '',
    entity_type: 'pessoa_fisica'
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    try {
      const { error } = await supabase
        .from('driver_profiles')
        .insert([newDriver]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver added successfully",
      });

      setNewDriver({
        full_name: '',
        email: '',
        phone: '',
        car_make: '',
        car_model: '',
        car_year: '',
        car_color: '',
        license_plate: '',
        entity_type: 'pessoa_fisica'
      });
      setIsAddDialogOpen(false);
      loadDrivers();
    } catch (error) {
      console.error('Error adding driver:', error);
      toast({
        title: "Error",
        description: "Failed to add driver",
        variant: "destructive",
      });
    }
  };

  const updateDriverStatus = async (driverId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ status })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Driver status updated to ${status}`,
      });

      loadDrivers();
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast({
        title: "Error",
        description: "Failed to update driver status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Driver Management</h2>
          <p className="text-muted-foreground">Manage your driver network</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newDriver.full_name}
                  onChange={(e) => setNewDriver({...newDriver, full_name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="car_make">Car Make</Label>
                  <Input
                    id="car_make"
                    value={newDriver.car_make}
                    onChange={(e) => setNewDriver({...newDriver, car_make: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="car_model">Car Model</Label>
                  <Input
                    id="car_model"
                    value={newDriver.car_model}
                    onChange={(e) => setNewDriver({...newDriver, car_model: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="car_year">Car Year</Label>
                  <Input
                    id="car_year"
                    value={newDriver.car_year}
                    onChange={(e) => setNewDriver({...newDriver, car_year: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="car_color">Car Color</Label>
                  <Input
                    id="car_color"
                    value={newDriver.car_color}
                    onChange={(e) => setNewDriver({...newDriver, car_color: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  value={newDriver.license_plate}
                  onChange={(e) => setNewDriver({...newDriver, license_plate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="entity_type">Entity Type</Label>
                <Select value={newDriver.entity_type} onValueChange={(value) => setNewDriver({...newDriver, entity_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                    <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDriver}>
                  Add Driver
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading drivers...</div>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver: any) => (
            <Card key={driver.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={driver.profile_photo_url} />
                      <AvatarFallback>{driver.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{driver.full_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{driver.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{driver.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Car className="h-3 w-3" />
                          <span>{driver.car_make} {driver.car_model} ({driver.car_year})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(driver.status)}>
                      {driver.status.toUpperCase()}
                    </Badge>
                    
                    {driver.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateDriverStatus(driver.id, 'approved')}
                      >
                        Approve
                      </Button>
                    )}
                    
                    {driver.status === 'approved' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateDriverStatus(driver.id, 'suspended')}
                      >
                        Suspend
                      </Button>
                    )}
                    
                    {driver.status === 'suspended' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateDriverStatus(driver.id, 'approved')}
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
