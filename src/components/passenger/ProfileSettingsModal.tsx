
import { useState, useEffect } from "react";
import { X, User, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getMyPassengerProfile, upsertMyPassengerProfile, uploadAvatar } from "@/lib/api/profiles";
import { PhotoUpload } from "@/components/profile/PhotoUpload";

interface PassengerProfile {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
}

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PassengerProfile | null;
  onProfileUpdate: (profile: PassengerProfile) => void;
}

export const ProfileSettingsModal = ({ 
  isOpen, 
  onClose, 
  profile: initialProfile,
  onProfileUpdate
}: ProfileSettingsModalProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    try {
      const profile = await getMyPassengerProfile();
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        email: profile.email || ''
      });
      setAvatarUrl(profile.avatarUrl);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do perfil",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const newAvatarUrl = await uploadAvatar(file);
      setAvatarUrl(newAvatarUrl);
      
      toast({
        title: "Sucesso",
        description: "Foto atualizada com sucesso!"
      });
    } catch (error) {
      console.error('Photo upload failed:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao fazer upload da foto. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Nome e sobrenome são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const firstName = formData.first_name.trim() || 'User';
      const lastName = formData.last_name.trim() || '';
      
      await upsertMyPassengerProfile({
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone.trim(),
        email: formData.email.trim()
      });

      // Create updated profile object
      const updatedProfile: PassengerProfile = {
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        avatarUrl: avatarUrl
      };

      // Notify parent and close
      onProfileUpdate(updatedProfile);
      onClose();

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso"
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar perfil",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (initialProfile) {
      setFormData({
        first_name: initialProfile.first_name || '',
        last_name: initialProfile.last_name || '',
        phone: initialProfile.phone || '',
        email: initialProfile.email || ''
      });
      setAvatarUrl(initialProfile.avatarUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  const displayName = `${formData.first_name} ${formData.last_name}`.trim() || 'Usuário';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-[#FF385C]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Editar Perfil
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Photo Upload Section */}
            <div className="text-center">
              <PhotoUpload
                currentPhotoUrl={avatarUrl}
                userName={displayName}
                onPhotoUpload={handlePhotoUpload}
                isUploading={isUploadingPhoto}
                size="lg"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Seu nome"
                    className="focus:ring-[#FF385C] focus:border-[#FF385C]"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    disabled={isSaving}
                    placeholder="Seu sobrenome"
                    className="focus:ring-[#FF385C] focus:border-[#FF385C]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Seu telefone"
                  className="focus:ring-[#FF385C] focus:border-[#FF385C]"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Seu email"
                  className="focus:ring-[#FF385C] focus:border-[#FF385C]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex gap-3">
            <Button 
              onClick={handleSave}
              disabled={isSaving || isUploadingPhoto}
              className="flex-1 bg-[#FF385C] hover:bg-[#E31C5F] text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
