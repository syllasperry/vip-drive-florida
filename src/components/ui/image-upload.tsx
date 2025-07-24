import { useState, useRef } from "react";
import { Upload, Camera, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  currentImageUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  allowCamera?: boolean;
}

export const ImageUpload = ({ 
  onUpload, 
  currentImageUrl, 
  className,
  size = "md",
  showProgress = true,
  allowCamera = true
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20", 
    lg: "h-32 w-32"
  };

  const handleFileSelect = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await onUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setPreviewUrl(null);
      }, 500);
    } catch (error) {
      setError('Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const imageUrl = previewUrl || currentImageUrl;

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className={cn(
        "relative rounded-full overflow-hidden bg-muted flex items-center justify-center group cursor-pointer",
        sizeClasses[size],
        "hover:ring-2 hover:ring-primary/50 transition-all duration-300"
      )}
      onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn(
            "text-muted-foreground",
            size === "sm" ? "h-4 w-4" : size === "md" ? "h-8 w-8" : "h-12 w-12"
          )} />
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <Upload className={cn(
            "text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-6 w-6"
          )} />
        </div>
      </div>

      {showProgress && isUploading && (
        <div className="w-full max-w-xs">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
          <X className="h-4 w-4 text-destructive" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        
        {allowCamera && (
          <Button 
            variant="outline" 
            size="sm"
            disabled={isUploading}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
        )}
      </div>
    </div>
  );
};