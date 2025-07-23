import React, { useState, useRef, useCallback } from "react";
import { X, Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraCapture = ({ isOpen, onClose, onCapture }: CameraCaptureProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError("");
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" // Front camera for profile photos
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check your permissions.");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        onCapture(file);
        handleClose();
      }
    }, "image/jpeg", 0.8);
  }, [onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    setError("");
    onClose();
  }, [stopCamera, onClose]);

  // Start camera when modal opens
  React.useEffect(() => {
    if (isOpen && !stream && !isInitializing) {
      startCamera();
    }
  }, [isOpen, stream, isInitializing, startCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Take Photo</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Camera View */}
        <div className="p-6 space-y-4">
          {error ? (
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={startCamera} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : isInitializing ? (
            <div className="text-center space-y-4">
              <div className="w-64 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                <p className="text-muted-foreground">Initializing camera...</p>
              </div>
            </div>
          ) : stream ? (
            <div className="text-center space-y-4">
              <div className="relative w-64 h-48 bg-black rounded-lg mx-auto overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play();
                    }
                  }}
                />
              </div>
              <Button onClick={capturePhoto} variant="luxury" size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Capture Photo
              </Button>
            </div>
          ) : null}
          
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};