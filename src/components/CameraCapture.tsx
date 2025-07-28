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
      console.log("Starting camera...");
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device");
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          facingMode: "user"
        },
        audio: false
      });
      
      console.log("Camera stream obtained successfully");
      setStream(mediaStream);
      
      if (videoRef.current) {
        console.log("Setting video stream to element...");
        videoRef.current.srcObject = mediaStream;
        
        // Set video attributes for better mobile compatibility
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        
        // Enhanced mobile compatibility setup
        const video = videoRef.current;
        video.playsInline = true;
        video.muted = true;
        video.controls = false;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        // For iOS Safari compatibility
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        
        // Enhanced promise with better mobile handling
        const waitForVideo = new Promise((resolve, reject) => {
          let resolved = false;
          let attempts = 0;
          const maxAttempts = 5;
          
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('loadeddata', onLoadedData);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('error', onError);
          };
          
          const checkVideoReady = () => {
            if (resolved) return;
            
            const hasValidDimensions = video.videoWidth > 0 && video.videoHeight > 0;
            const isReadyToPlay = video.readyState >= 2; // HAVE_CURRENT_DATA
            
            console.log("Video check:", {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
              hasValidDimensions,
              isReadyToPlay
            });
            
            if (hasValidDimensions && isReadyToPlay) {
              resolved = true;
              cleanup();
              resolve(undefined);
            }
          };
          
          const onLoadedMetadata = () => {
            console.log("Video metadata loaded");
            checkVideoReady();
          };
          
          const onLoadedData = () => {
            console.log("Video data loaded");
            checkVideoReady();
          };
          
          const onCanPlay = () => {
            console.log("Video can play");
            checkVideoReady();
          };
          
          const onPlaying = () => {
            console.log("Video is playing");
            checkVideoReady();
          };
          
          const onError = (e: Event) => {
            console.error("Video error:", e);
            if (!resolved) {
              resolved = true;
              cleanup();
              reject(new Error("Video failed to load"));
            }
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('loadeddata', onLoadedData);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('playing', onPlaying);
          video.addEventListener('error', onError);
          
          // Retry mechanism for mobile
          const retrySetup = () => {
            attempts++;
            console.log(`Setting up video, attempt ${attempts}`);
            
            // Force video to load stream again
            video.srcObject = null;
            setTimeout(() => {
              video.srcObject = mediaStream;
              video.load();
              video.play().catch(e => console.warn("Play attempt failed:", e));
            }, 100);
            
            if (attempts < maxAttempts) {
              setTimeout(retrySetup, 1000);
            }
          };
          
          // Initial setup
          retrySetup();
          
          // Timeout fallback - be more generous for mobile
          setTimeout(() => {
            if (!resolved) {
              console.log("Video setup timeout, attempting to continue");
              resolved = true;
              cleanup();
              // Don't reject, try to continue anyway
              resolve(undefined);
            }
          }, 8000);
        });
        
        await waitForVideo;
        
        // Try to play the video
        try {
          await videoRef.current.play();
          console.log("Video playing successfully");
        } catch (playError) {
          console.warn("Video autoplay failed, will try manual interaction:", playError);
          // For mobile Safari, we might need user interaction
        }
        
        // Double check video is ready
        if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          setIsVideoReady(true);
          console.log("Camera initialization complete");
        } else {
          console.log("Video dimensions still 0, but continuing...");
          setIsVideoReady(true);
        }
        
        setIsInitializing(false);
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

  // Timeout fallback to handle stuck initialization
  React.useEffect(() => {
    if (isInitializing && !isVideoReady) {
      const timeout = setTimeout(() => {
        if (isInitializing && !isVideoReady) {
          console.error("Camera initialization timeout");
          setError("Camera failed to initialize. Please try again.");
          setIsInitializing(false);
        }
      }, 8000); // 8 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isInitializing, isVideoReady]);

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
                    console.log("Video metadata loaded");
                    if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                      console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
                      setIsVideoReady(true);
                      setIsInitializing(false);
                    }
                  }}
                  onCanPlay={() => {
                    console.log("Video can play - setting ready");
                    setIsVideoReady(true);
                    setIsInitializing(false);
                  }}
                  onError={(e) => {
                    console.error("Video error:", e);
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