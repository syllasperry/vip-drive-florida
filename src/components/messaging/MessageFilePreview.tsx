import { useState } from "react";
import { Play, FileText, Download, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageFilePreviewProps {
  message: string;
  isCurrentUser: boolean;
}

export const MessageFilePreview = ({ message, isCurrentUser }: MessageFilePreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Check if message contains a Supabase file URL
  const supabaseUrlPattern = /https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s]+/;
  const urlMatch = message.match(supabaseUrlPattern);
  
  if (!urlMatch) {
    // Regular message content - render text with links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);
    
    return (
      <p className="text-sm leading-relaxed">
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:opacity-80 break-words ${
                  isCurrentUser ? "text-primary-foreground" : "text-blue-600"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </p>
    );
  }

  const fileUrl = urlMatch[0];
  const fileLines = message.split('\n');
  const fileName = fileLines[0].replace(/^[📷🎥📎]\s*/, ''); // Remove emoji prefix
  const fileExtension = fileUrl.split('.').pop()?.toLowerCase() || '';

  // Determine file type
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
  const isVideo = ['mp4', 'mov', 'avi', 'webm', 'ogg'].includes(fileExtension);
  const isDocument = !isImage && !isVideo;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="space-y-2">
      {/* File Preview */}
      {isImage && !imageError ? (
        <div className="relative max-w-xs">
          <img
            src={fileUrl}
            alt={fileName}
            className="rounded-lg max-h-64 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity"
            onError={() => setImageError(true)}
            onClick={() => window.open(fileUrl, '_blank')}
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 text-white" />
          </Button>
        </div>
      ) : isVideo && !videoError ? (
        <div className="relative max-w-xs">
          <video
            className="rounded-lg max-h-64 w-full bg-black"
            controls
            preload="metadata"
            onError={() => setVideoError(true)}
          >
            <source src={fileUrl} type={`video/${fileExtension}`} />
            Your browser does not support the video tag.
          </video>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 text-white" />
          </Button>
        </div>
      ) : (
        // Document or fallback for failed media
        <div 
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${
            isCurrentUser 
              ? "bg-primary-foreground/10 border-primary-foreground/20" 
              : "bg-background border-border"
          }`}
          onClick={handleDownload}
        >
          <div className={`p-2 rounded-full ${
            isCurrentUser ? "bg-primary-foreground/20" : "bg-muted"
          }`}>
            {imageError && isImage ? (
              <Image className="h-5 w-5" />
            ) : videoError && isVideo ? (
              <Video className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${
              isCurrentUser ? "text-primary-foreground" : "text-foreground"
            }`}>
              {fileName}
            </p>
            <p className={`text-xs ${
              isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}>
              {fileExtension.toUpperCase()} file • Click to download
            </p>
          </div>
          <Download className="h-4 w-4 flex-shrink-0" />
        </div>
      )}
    </div>
  );
};