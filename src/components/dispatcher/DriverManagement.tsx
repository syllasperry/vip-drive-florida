
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
import { Plus, Phone, Mail, Car, Edit, Trash2, Link, User, Building } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const DriverManagement = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [newDriver, setNewDriver] = useState({
    full_name: '',
    email: '',
    phone: '',
    car_make: '',
    car_model: '',
    car_year: '',
    car_color: '',
    license_plate: '',
    car_type: 'sedan',
    business_type: 'individual',
    bank_info: {
      zelle: '',
      venmo: '',
      account_name: '',
      account_type: '',
      routing_number: '',
      account_number: ''
    },
    status: 'active'
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar motoristas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDriver = async () => {
    try {
      const { error } = await supabase
        .from('drivers')
        .insert([{
          ...newDriver,
          bank_info: newDriver.bank_info,
          self_registered: false
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Motorista adicionado com sucesso",
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
        car_type: 'sedan',
        business_type: 'individual',
        bank_info: {
          zelle: '',
          venmo: '',
          account_name: '',
          account_type: '',
          routing_number: '',
          account_number: ''
        },
        status: 'active'
      });
      setIsAddDialogOpen(false);
      loadDrivers();
    } catch (error) {
      console.error('Error adding driver:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar motorista",
        variant: "destructive",
      });
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          ...selectedDriver,
          bank_info: selectedDriver.bank_info
        })
        .eq('id', selectedDriver.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Motorista atualizado com sucesso",
      });

      setIsEditDialogOpen(false);
      setSelectedDriver(null);
      loadDrivers();
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar motorista",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Tem certeza que deseja excluir este motorista?')) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Motorista excluído com sucesso",
      });

      loadDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir motorista",
        variant: "destructive",
      });
    }
  };

  const handleSendRegistrationLink = async () => {
    if (!linkEmail) {
      toast({
        title: "Erro",
        description: "Por favor, insira um e-mail",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { error } = await supabase
        .from('driver_registration_links')
        .insert([{
          email: linkEmail,
          token: token,
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;

      // Here you would integrate with your email service
      console.log(`Registration link: ${window.location.origin}/driver/register?token=${token}`);

      toast({
        title: "Sucesso",
        description: `Link de cadastro enviado para ${linkEmail}`,
      });

      setLinkEmail('');
      setIsLinkDialogOpen(false);
    } catch (error) {
      console.error('Error sending registration link:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar link de cadastro",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (driver) => {
    setSelectedDriver({
      ...driver,
      bank_info: driver.bank_info || {
        zelle: '',
        venmo: '',
        account_name: '',
        account_type: '',
        routing_number: '',
        account_number: ''
      }
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Motoristas</h2>
          <p className="text-muted-foreground">Gerencie sua rede de motoristas</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link className="h-4 w-4 mr-2" />
                Enviar Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enviar Link de Cadastro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="link_email">E-mail do Motorista</Label>
                  <Input
                    id="link_email"
                    type="email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="motorista@email.com"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSendRegistrationLink}>
                    Enviar Link
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Motorista
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Motorista</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={newDriver.full_name}
                      onChange={(e) => setNewDriver({...newDriver, full_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDriver.email}
                      onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_type">Tipo de Cadastro</Label>
                    <Select value={newDriver.business_type} onValueChange={(value) => setNewDriver({...newDriver, business_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Pessoa Física</SelectItem>
                        <SelectItem value="business">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Informações do Veículo</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="car_make">Marca</Label>
                      <Input
                        id="car_make"
                        value={newDriver.car_make}
                        onChange={(e) => setNewDriver({...newDriver, car_make: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="car_model">Modelo</Label>
                      <Input
                        id="car_model"
                        value={newDriver.car_model}
                        onChange={(e) => setNewDriver({...newDriver, car_model: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="car_year">Ano</Label>
                      <Input
                        id="car_year"
                        value={newDriver.car_year}
                        onChange={(e) => setNewDriver({...newDriver, car_year: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="car_color">Cor</Label>
                      <Input
                        id="car_color"
                        value={newDriver.car_color}
                        onChange={(e) => setNewDriver({...newDriver, car_color: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_plate">Placa</Label>
                      <Input
                        id="license_plate"
                        value={newDriver.license_plate}
                        onChange={(e) => setNewDriver({...newDriver, license_plate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Informações Bancárias</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zelle">Zelle</Label>
                      <Input
                        id="zelle"
                        value={newDriver.bank_info.zelle}
                        onChange={(e) => setNewDriver({
                          ...newDriver, 
                          bank_info: {...newDriver.bank_info, zelle: e.target.value}
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="venmo">Venmo</Label>
                      <Input
                        id="venmo"
                        value={newDriver.bank_info.venmo}
                        onChange={(e) => setNewDriver({
                          ...newDriver, 
                          bank_info: {...newDriver.bank_info, venmo: e.target.value}
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="account_name">Nome da Conta</Label>
                      <Input
                        id="account_name"
                        value={newDriver.bank_info.account_name}
                        onChange={(e) => setNewDriver({
                          ...newDriver, 
                          bank_info: {...newDriver.bank_info, account_name: e.target.value}
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_type">Tipo de Conta</Label>
                      <Select 
                        value={newDriver.bank_info.account_type} 
                        onValueChange={(value) => setNewDriver({
                          ...newDriver, 
                          bank_info: {...newDriver.bank_info, account_type: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Conta Corrente</SelectItem>
                          <SelectItem value="savings">Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddDriver}>
                    Adicionar Motorista
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando motoristas...</div>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver: any) => (
            <Card key={driver.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={driver.profile_photo_url} />
                      <AvatarFallback>
                        {driver.business_type === 'business' ? (
                          <Building className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
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
                      <div className="mt-1">
                        <Badge variant="secondary" className="mr-2">
                          {driver.business_type === 'business' ? 'PJ' : 'PF'}
                        </Badge>
                        <Badge className={driver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {driver.status === 'active' ? 'ATIVO' : 'INATIVO'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(driver)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDriver(driver.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Driver Dialog */}
      {selectedDriver && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Motorista</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Similar form structure as add dialog but with selectedDriver data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_full_name">Nome Completo</Label>
                  <Input
                    id="edit_full_name"
                    value={selectedDriver.full_name || ''}
                    onChange={(e) => setSelectedDriver({...selectedDriver, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">E-mail</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={selectedDriver.email || ''}
                    onChange={(e) => setSelectedDriver({...selectedDriver, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_phone">Telefone</Label>
                  <Input
                    id="edit_phone"
                    value={selectedDriver.phone || ''}
                    onChange={(e) => setSelectedDriver({...selectedDriver, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select 
                    value={selectedDriver.status} 
                    onValueChange={(value) => setSelectedDriver({...selectedDriver, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Informações do Veículo</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit_car_make">Marca</Label>
                    <Input
                      id="edit_car_make"
                      value={selectedDriver.car_make || ''}
                      onChange={(e) => setSelectedDriver({...selectedDriver, car_make: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_car_model">Modelo</Label>
                    <Input
                      id="edit_car_model"
                      value={selectedDriver.car_model || ''}
                      onChange={(e) => setSelectedDriver({...selectedDriver, car_model: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_car_year">Ano</Label>
                    <Input
                      id="edit_car_year"
                      value={selectedDriver.car_year || ''}
                      onChange={(e) => setSelectedDriver({...selectedDriver, car_year: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Informações Bancárias</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_zelle">Zelle</Label>
                    <Input
                      id="edit_zelle"
                      value={selectedDriver.bank_info?.zelle || ''}
                      onChange={(e) => setSelectedDriver({
                        ...selectedDriver, 
                        bank_info: {...selectedDriver.bank_info, zelle: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_venmo">Venmo</Label>
                    <Input
                      id="edit_venmo"
                      value={selectedDriver.bank_info?.venmo || ''}
                      onChange={(e) => setSelectedDriver({
                        ...selectedDriver, 
                        bank_info: {...selectedDriver.bank_info, venmo: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditDriver}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
