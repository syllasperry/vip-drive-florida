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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError("");
    setIsVideoReady(false);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      
      setStream(mediaStream);
      
      // Ensure video element is available before setting stream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Force video to load and play
        try {
          await videoRef.current.load();
          await videoRef.current.play();
        } catch (playError) {
          console.warn("Video play failed, but continuing:", playError);
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Unable to access camera. Please check your permissions.";
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera permissions and try again.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        }
      }
      
      setError(errorMessage);
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleClose = useCallback(() => {
    stopCamera();
    setError("");
    setIsVideoReady(false);
    setIsInitializing(false);
    onClose();
  }, [stopCamera, onClose]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      setError("Camera components not ready. Please try again.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Canvas context not available");
      setError("Canvas not ready. Please try again.");
      return;
    }

    // Check if video has valid dimensions and is ready
    if (!isVideoReady || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      console.error("Video not ready:", { 
        isVideoReady, 
        videoWidth: video.videoWidth, 
        videoHeight: video.videoHeight, 
        readyState: video.readyState 
      });
      setError("Camera not ready. Please wait for the video to load completely.");
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas (mirror it back for capture)
    context.save();
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0);
    context.restore();

    console.log("Photo captured with dimensions:", canvas.width, "x", canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        console.log("Blob created successfully:", blob.size, "bytes");
        // Create a File object from the blob
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        onCapture(file);
        handleClose();
      } else {
        console.error("Failed to create blob from canvas");
        setError("Failed to capture photo. Please try again.");
      }
    }, "image/jpeg", 0.8);
  }, [isVideoReady, onCapture, handleClose]);

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
                  controls={false}
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  onLoadedMetadata={() => {
                    if (videoRef.current && videoRef.current.videoWidth > 0) {
                      setIsVideoReady(true);
                      setIsInitializing(false);
                    }
                  }}
                  onCanPlay={() => {
                    setIsVideoReady(true);
                    setIsInitializing(false);
                  }}
                  onPlaying={() => {
                    setIsVideoReady(true);
                    setIsInitializing(false);
                  }}
                  onError={() => {
                    setError("Failed to display camera feed. Please try again.");
                    setIsInitializing(false);
                  }}
                />
              </div>
              {isVideoReady && (
                <Button onClick={capturePhoto} variant="luxury" size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </Button>
              )}
            </div>
          ) : null}
          
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};