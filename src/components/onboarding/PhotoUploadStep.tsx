
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
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Add your photo
        </h3>
        <p className="text-gray-600 text-sm">
          This helps drivers and other passengers recognize you (optional)
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
            <AvatarImage src={currentPhoto || undefined} alt={userName} className="object-cover" />
            <AvatarFallback className="text-2xl bg-gray-100 text-gray-600 font-semibold">
              {userName ? getInitials(userName) : <User className="w-12 h-12" />}
            </AvatarFallback>
          </Avatar>
          
          <Button
            type="button"
            size="sm"
            className="absolute -bottom-2 -right-2 rounded-full w-12 h-12 p-0 bg-[#FF385C] hover:bg-[#E31C5F] border-4 border-white shadow-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-6 h-6 text-white" />
          </Button>
        </div>

        <div
          className={`w-full max-w-sm border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
            dragActive 
              ? 'border-[#FF385C] bg-red-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-700 mb-1 font-semibold">
            Drag a photo here or click to select
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG up to 10MB
          </p>
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
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
          >
            Remove photo
          </Button>
        )}
      </div>
    </div>
  );
};
