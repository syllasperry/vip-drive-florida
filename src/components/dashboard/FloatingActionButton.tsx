import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export const FloatingActionButton = ({ onClick, label = "New Booking" }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-20 right-6 h-14 px-6 bg-gradient-to-r from-primary to-primary-glow shadow-[var(--shadow-luxury)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 rounded-full z-40"
    >
      <Plus className="h-5 w-5 mr-2" />
      <span className="font-medium">{label}</span>
    </Button>
  );
};