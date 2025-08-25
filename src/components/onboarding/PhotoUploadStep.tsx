
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, User } from 'lucide-react';

interface PhotoUploadStepProps {
  onPhotoSelect: (file: File | null, previewUrl: string | null) => void;
  currentPhoto: string | null;
  userName: string;
}

export const PhotoUploadStep: React.FC<PhotoUploadStepProps> = ({
  onPhotoSelect,
  currentPhoto,
  userName
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      onPhotoSelect(file, previewUrl);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Adicione sua foto
        </h3>
        <p className="text-muted-foreground text-sm">
          Isso ajuda motoristas e outros passageiros a te reconhecer (opcional)
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-border">
            <AvatarImage src={currentPhoto || undefined} alt={userName} />
            <AvatarFallback className="text-lg bg-muted">
              {userName ? getInitials(userName) : <User className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>
          
          <Button
            type="button"
            size="sm"
            className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-primary hover:bg-primary/90"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>

        <div
          className={`w-full max-w-sm border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Arraste uma foto aqui ou clique para selecionar
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Escolher arquivo
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {currentPhoto && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPhotoSelect(null, null)}
            className="text-muted-foreground hover:text-foreground"
          >
            Remover foto
          </Button>
        )}
      </div>
    </div>
  );
};
