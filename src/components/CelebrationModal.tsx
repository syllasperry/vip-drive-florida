import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  showConfetti?: boolean;
}

const CelebrationModal = ({ 
  isOpen, 
  onClose, 
  title = "🎉 Welcome to VIP! 🎉",
  message = "You're officially part of the premium club.\nYour exclusive ride experience begins now.",
  actionText = "Go to Dashboard",
  onAction,
  showConfetti = true
}: CelebrationModalProps) => {
  const navigate = useNavigate();
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    if (isOpen && showConfetti) {
      setConfettiActive(true);
      const timer = setTimeout(() => setConfettiActive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showConfetti]);

  // Auto-close welcome modal after 4 seconds
  useEffect(() => {
    if (isOpen && title.includes("Welcome to VIP")) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, title, onClose]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      navigate("/passenger/dashboard");
    }
    onClose();
  };

  return (
    <>
      {confettiActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <div 
                className="w-2 h-2 opacity-80"
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md mx-4 p-0 overflow-hidden rounded-xl shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-background/20 p-2 text-muted-foreground hover:bg-background/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 text-center space-y-6 relative">
            <div className="flex justify-center">
              <div className="bg-primary/20 p-4 rounded-full animate-pulse">
                <Wine className="h-16 w-16 text-primary" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-foreground">{title}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>
            
            <Button 
              onClick={handleAction}
              variant="luxury"
              size="lg"
              className="w-full text-lg py-3"
            >
              {actionText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CelebrationModal;