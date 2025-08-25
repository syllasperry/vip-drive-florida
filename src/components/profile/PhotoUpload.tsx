
import React, { useState, useRef } from 'react';
import { Camera, Upload, User, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  userName?: string;
  onPhotoUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhotoUrl,
  userName = 'User',
  onPhotoUpload,
  isUploading = false,
  size = 'lg'
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24', 
    lg: 'h-32 w-32'
  };

  const getInitials = () => {
    return userName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem (JPG, PNG, GIF, WebP)",
        variant: "destructive"
      });
      return false;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande", 
        description: "O tamanho do arquivo deve ser menor que 5MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload file
      await onPhotoUpload(file);
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      // Clear preview after successful upload
      setTimeout(() => {
        setPreviewUrl(null);
        URL.revokeObjectURL(preview);
      }, 1000);

    } catch (error) {
      console.error('Erro no upload da foto:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao fazer upload da foto. Tente novamente.",
        variant: "destructive"
      });
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Clear input
    event.target.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const displayImageUrl = previewUrl || currentPhotoUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} ring-4 ring-white shadow-lg`}>
          <AvatarImage 
            src={displayImageUrl || undefined} 
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="bg-[#FF385C] text-white text-lg font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Clear Preview Button */}
        {previewUrl && !isUploading && (
          <button
            onClick={clearPreview}
            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerFileUpload}
          disabled={isUploading}
          className="flex items-center gap-2 border-[#FF385C] text-[#FF385C] hover:bg-[#FF385C] hover:text-white"
        >
          <Upload className="w-4 h-4" />
          Carregar Foto
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerCameraCapture}
          disabled={isUploading}
          className="flex items-center gap-2 border-[#FF385C] text-[#FF385C] hover:bg-[#FF385C] hover:text-white"
        >
          <Camera className="w-4 h-4" />
          Tirar Foto
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};
