
import React, { useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload, User, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  userName?: string;
  onPhotoUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhotoUrl,
  userName = 'User',
  onPhotoUpload,
  isUploading = false,
  size = 'md',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onPhotoUpload(file);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar with Upload Overlay */}
      <div 
        className={`relative ${sizeClasses[size]} cursor-pointer group`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <Avatar className={`${sizeClasses[size]} ring-2 ring-gray-200 transition-all duration-200 ${dragOver ? 'ring-[#FF385C] ring-4' : ''}`}>
          <AvatarImage 
            src={currentPhotoUrl || undefined} 
            alt={userName}
            className="object-cover"
          />
          <AvatarFallback className="bg-[#FF385C] text-white font-semibold text-lg">
            {currentPhotoUrl ? <User className="h-6 w-6" /> : getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {/* Upload Overlay */}
        <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity duration-200 ${
          isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Drag & Drop Indicator */}
        {dragOver && (
          <div className="absolute inset-0 bg-[#FF385C]/20 rounded-full border-2 border-dashed border-[#FF385C] flex items-center justify-center">
            <Upload className="h-6 w-6 text-[#FF385C]" />
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Click or drag a photo here
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={isUploading}
          className="text-[#FF385C] border-[#FF385C] hover:bg-[#FF385C] hover:text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Choose Photo
            </>
          )}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};
