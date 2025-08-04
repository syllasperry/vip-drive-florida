import { Button } from "@/components/ui/button";

interface BookingToggleProps {
  activeView: "upcoming" | "new-rides" | "past";
  onViewChange: (view: "upcoming" | "new-rides" | "past") => void;
}

export const BookingToggle = ({ activeView, onViewChange }: BookingToggleProps) => {
  return (
    <div className="flex bg-muted/30 rounded-xl p-1 mb-6">
      <Button
        onClick={() => onViewChange("upcoming")}
        variant={activeView === "upcoming" ? "default" : "ghost"}
        className={`flex-1 rounded-lg transition-all duration-300 text-xs ${
          activeView === "upcoming"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Upcoming
      </Button>
      <Button
        onClick={() => onViewChange("new-rides")}
        variant={activeView === "new-rides" ? "default" : "ghost"}
        className={`flex-1 rounded-lg transition-all duration-300 text-xs ${
          activeView === "new-rides"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        New Rides
      </Button>
      <Button
        onClick={() => onViewChange("past")}
        variant={activeView === "past" ? "default" : "ghost"}
        className={`flex-1 rounded-lg transition-all duration-300 text-xs ${
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