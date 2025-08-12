
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Plus, Upload, Car, User, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  profile_photo_url?: string;
  status: string;
  notes?: string;
  created_at: string;
  car_make?: string;
  car_model?: string;
  car_year?: string;
  car_color?: string;
  license_plate?: string;
}

interface DriverManagementProps {
  drivers: Driver[];
  onDriverUpdate: () => Promise<void>;
}

export const DriverManagement = ({ drivers, onDriverUpdate }: DriverManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    notes: "",
    profile_photo_url: "",
    car_make: "",
    car_model: "",
    car_year: "",
    car_color: "",
    license_plate: "",
    capacity: "",
    car_photo_url: "",
    insurance_exp: "",
    registration_exp: "",
    license_exp: ""
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      notes: "",
      profile_photo_url: "",
      car_make: "",
      car_model: "",
      car_year: "",
      car_color: "",
      license_plate: "",
      capacity: "",
      car_photo_url: "",
      insurance_exp: "",
      registration_exp: "",
      license_exp: ""
    });
    setEditingDriver(null);
    setActiveTab("profile");
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setFormData({
      full_name: driver.full_name || "",
      phone: driver.phone || "",
      email: driver.email || "",
      notes: driver.notes || "",
      profile_photo_url: driver.profile_photo_url || "",
      car_make: driver.car_make || "",
      car_model: driver.car_model || "",
      car_year: driver.car_year || "",
      car_color: driver.car_color || "",
      license_plate: driver.license_plate || "",
      capacity: "",
      car_photo_url: "",
      insurance_exp: "",
      registration_exp: "",
      license_exp: ""
    });
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('driver-files')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('driver-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileUpload = async (file: File, type: 'photo' | 'vehicle' | 'document') => {
    if (!file) return;

    setUploading(true);
    try {
      const path = type === 'photo' ? 'photos' : type === 'vehicle' ? 'vehicles' : 'documents';
      const url = await uploadFile(file, path);
      
      if (type === 'photo') {
        setFormData(prev => ({ ...prev, profile_photo_url: url }));
      } else if (type === 'vehicle') {
        setFormData(prev => ({ ...prev, car_photo_url: url }));
      }
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.phone) {
      toast({
        title: "Error",
        description: "Full name and phone are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDriver) {
        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes,
            profile_photo_url: formData.profile_photo_url,
            car_make: formData.car_make,
            car_model: formData.car_model,
            car_year: formData.car_year,
            car_color: formData.car_color,
            license_plate: formData.license_plate,
          })
          .eq('id', editingDriver.id);

        if (error) throw error;
      } else {
        // Create new driver
        const { error } = await supabase
          .from('drivers')
          .insert({
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes,
            profile_photo_url: formData.profile_photo_url,
            car_make: formData.car_make,
            car_model: formData.car_model,
            car_year: formData.car_year,
            car_color: formData.car_color,
            license_plate: formData.license_plate,
            status: 'active'
          });

        if (error) throw error;
      }

      await onDriverUpdate();
      setIsModalOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: `Driver ${editingDriver ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingDriver ? 'update' : 'create'} driver`,
        variant: "destructive",
      });
    }
  };

  const handleStatusToggle = async (driver: Driver) => {
    const newStatus = driver.status === 'active' ? 'suspended' : 'active';
    
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: newStatus })
        .eq('id', driver.id);

      if (error) throw error;

      await onDriverUpdate();
      
      toast({
        title: "Success",
        description: `Driver ${newStatus === 'active' ? 'reactivated' : 'suspended'} successfully`,
      });
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: "Error",
        description: "Failed to update driver status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>

      {/* Driver List */}
      <div className="space-y-4">
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No drivers found. Click '+ Add Driver' to get started.</p>
          </div>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={driver.profile_photo_url} alt={driver.full_name} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {driver.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{driver.full_name}</h3>
                        <Badge 
                          variant={driver.status === 'active' ? 'default' : 'destructive'}
                          className={driver.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {driver.status === 'active' ? 'Active' : 'Suspended'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{driver.phone}</p>
                      
                      {(driver.car_make || driver.car_model || driver.license_plate) && (
                        <p className="text-sm text-gray-500">
                          {[driver.car_make, driver.car_model, driver.car_color, driver.license_plate]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(driver)}
                      className="flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                    
                    <Button
                      variant={driver.status === 'active' ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleStatusToggle(driver)}
                    >
                      {driver.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={openAddModal}
          className="h-14 w-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg border-2 border-yellow-400"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Add/Edit Driver Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? 'Edit Driver' : 'Add Driver'}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="flex items-center space-x-2">
                <Car className="h-4 w-4" />
                <span>Vehicle</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Documents</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Label htmlFor="photo-upload">Upload Photo</Label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'photo');
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vehicle" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="car_make">Make *</Label>
                  <Input
                    id="car_make"
                    value={formData.car_make}
                    onChange={(e) => setFormData(prev => ({ ...prev, car_make: e.target.value }))}
                    placeholder="e.g., Tesla"
                  />
                </div>
                <div>
                  <Label htmlFor="car_model">Model *</Label>
                  <Input
                    id="car_model"
                    value={formData.car_model}
                    onChange={(e) => setFormData(prev => ({ ...prev, car_model: e.target.value }))}
                    placeholder="e.g., Model Y"
                  />
                </div>
                <div>
                  <Label htmlFor="car_year">Year</Label>
                  <Input
                    id="car_year"
                    value={formData.car_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, car_year: e.target.value }))}
                    placeholder="e.g., 2023"
                  />
                </div>
                <div>
                  <Label htmlFor="car_color">Color</Label>
                  <Input
                    id="car_color"
                    value={formData.car_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, car_color: e.target.value }))}
                    placeholder="e.g., Silver"
                  />
                </div>
                <div>
                  <Label htmlFor="license_plate">Plate *</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                    placeholder="e.g., ABC123"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Select
                    value={formData.capacity}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 passengers</SelectItem>
                      <SelectItem value="5">5 passengers</SelectItem>
                      <SelectItem value="6">6 passengers</SelectItem>
                      <SelectItem value="7">7 passengers</SelectItem>
                      <SelectItem value="8">8 passengers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4">
                <input
                  id="vehicle-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'vehicle');
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => document.getElementById('vehicle-upload')?.click()}
                  disabled={uploading}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Vehicle Photo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <div className="space-y-6">
                <div>
                  <Label>Driver License</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'document');
                      }}
                    />
                    <Input
                      type="date"
                      value={formData.license_exp}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_exp: e.target.value }))}
                      placeholder="Expiration date"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Insurance</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'document');
                      }}
                    />
                    <Input
                      type="date"
                      value={formData.insurance_exp}
                      onChange={(e) => setFormData(prev => ({ ...prev, insurance_exp: e.target.value }))}
                      placeholder="Expiration date"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Registration</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'document');
                      }}
                    />
                    <Input
                      type="date"
                      value={formData.registration_exp}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_exp: e.target.value }))}
                      placeholder="Expiration date"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={uploading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Save Driver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
