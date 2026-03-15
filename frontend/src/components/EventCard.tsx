import {
  Plane,
  Hotel,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type EventType = "flight" | "hotel" | "activity";

export interface EventCardProps {
  type: EventType;
  title: string;
  date: string;
  location: string;
  detail?: string;
  notes?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const iconMap = {
  flight: Plane,
  hotel: Hotel,
  activity: Calendar,
};

const iconColorMap = {
  flight: "text-primary",
  hotel: "text-destructive",
  activity: "text-accent-foreground",
};

export function EventCard({
  type,
  title,
  date,
  location,
  detail,
  notes,
  onEdit,
  onDelete,
}: EventCardProps) {
  const Icon = iconMap[type];
  const iconColor = iconColorMap[type];
  const showActions = onEdit || onDelete;

  return (
    <div className="relative rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow border border-border">
      <div className={`absolute -right-8 -top-8 opacity-10 ${iconColor}`}>
        <Icon className="w-56 h-56" strokeWidth={1} />
      </div>
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">
              {date}
            </p>
            <h3 className="font-bold text-foreground mt-2 text-lg">{title}</h3>
            <p className="text-sm text-foreground/70 mt-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location}
            </p>
            {detail && (
              <p className="text-xs text-foreground/50 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {detail}
              </p>
            )}
            {notes && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                {notes}
              </p>
            )}
          </div>

          {showActions && (
            <div className="flex gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
