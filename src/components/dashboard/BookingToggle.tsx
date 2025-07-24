import { Button } from "@/components/ui/button";

interface BookingToggleProps {
  activeView: "upcoming" | "past";
  onViewChange: (view: "upcoming" | "past") => void;
}

export const BookingToggle = ({ activeView, onViewChange }: BookingToggleProps) => {
  return (
    <div className="flex bg-muted/30 rounded-xl p-1 mb-6">
      <Button
        onClick={() => onViewChange("upcoming")}
        variant={activeView === "upcoming" ? "default" : "ghost"}
        className={`flex-1 rounded-lg transition-all duration-300 ${
          activeView === "upcoming"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Upcoming
      </Button>
      <Button
        onClick={() => onViewChange("past")}
        variant={activeView === "past" ? "default" : "ghost"}
        className={`flex-1 rounded-lg transition-all duration-300 ${
          activeView === "past"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Past
      </Button>
    </div>
  );
};