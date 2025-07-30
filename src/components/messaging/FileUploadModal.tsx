import { useState, useRef } from "react";
import { X, Upload, Image, Video, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  type: "photo" | "camera";
}

export const FileUploadModal = ({
  isOpen,
  onClose,
  onSendMessage,
  type
}: FileUploadModalProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            // Immediately upload and send the photo
            setUploading(true);
            setUploadProgress(0);

            try {
              const fileExt = 'jpg';
              const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
              const filePath = `chat-files/${fileName}`;

              // Simulate upload progress
              const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
              }, 50);

              const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

              clearInterval(progressInterval);
              setUploadProgress(100);

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

              // Send the photo message
              onSendMessage(`📷 ${file.name}\n${publicUrl}`);
              
              // Close modal and stop camera
              handleClose();
              
              toast({
                title: "Photo Sent",
                description: "Your photo has been sent successfully",
              });
              
            } catch (error) {
              console.error('Error uploading photo:', error);
              toast({
                title: "Upload Failed",
                description: "Failed to send photo. Please try again.",
                variant: "destructive"
              });
            } finally {
              setUploading(false);
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    try {
      const fileUrl = await uploadFile();
      if (fileUrl) {
        const fileType = selectedFile?.type.startsWith('image/') ? '📷' : 
                        selectedFile?.type.startsWith('video/') ? '🎥' : '📎';
        const fileName = selectedFile?.name || 'file';
        
        onSendMessage(`${fileType} ${fileName}\n${fileUrl}`);
        handleClose();
        
        toast({
          title: "File Sent",
          description: "Your file has been sent successfully",
        });
      }
    } catch (error) {
      console.error('Error sending file:', error);
      // Error toast is already shown in uploadFile function
    }
  };

  const handleClose = () => {
    stopCamera();
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setUploading(false);
    onClose();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8" />;
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {type === "camera" ? "Take Photo" : "Share File"}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {type === "camera" && !selectedFile ? (
            <div className="space-y-4">
              <video
                ref={videoRef}
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: '4/3' }}
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex justify-center gap-3">
                <Button onClick={handleCamera} variant="outline">
                  Start Camera
                </Button>
                <Button 
                  onClick={capturePhoto} 
                  disabled={!videoRef.current?.srcObject || uploading}
                  className="min-w-[120px]"
                >
                  {uploading ? `${uploadProgress}%` : 'Capture Photo'}
                </Button>
              </div>
              
              {/* Upload Progress for Camera */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sending photo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          ) : type === "photo" && !selectedFile ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
              
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground font-medium">Select a file to share</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Images and videos up to 50MB
                </p>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="relative">
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full rounded-lg max-h-64 object-cover"
                  />
                ) : selectedFile.type.startsWith('video/') ? (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="w-full rounded-lg max-h-64"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                    {getFileIcon(selectedFile)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
                
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                  }}
                  className="absolute top-2 right-2 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleSend} 
                  disabled={uploading}
                  className="flex-1"
                >
                  Send File
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline"
                  disabled={uploading}
                >
                  Choose Different
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};