import { useState, useMemo } from "react";
import { isSameDay } from "date-fns";
import {
  nanosToDate,
  formatDisplayDate,
  formatDisplayTime,
  formatDayHeader,
} from "../utils/dateTime";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Share2,
  Check,
  Plane,
  MapPin,
  Calendar,
  Pencil,
  Copy,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTrip, useDeleteEvent } from "../hooks/useQueries";
import { Header } from "./Header";
import { EventCard, type EventType } from "./EventCard";
import { TripForm } from "./TripForm";
import { EventForm } from "./EventForm";
import type { TripWithEvents, Event } from "../backend";
import { getEventTypeString } from "../types";

interface TripDetailProps {
  tripId?: bigint | null;
  tripData?: TripWithEvents | null;
  isShared?: boolean;
  onBack?: () => void;
}

export function TripDetail({
  tripId,
  tripData: sharedTripData,
  isShared = false,
  onBack,
}: TripDetailProps) {
  const [showTripForm, setShowTripForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: fetchedTripData, isLoading } = useTrip(
    isShared ? null : (tripId ?? null),
  );
  const { mutate: deleteEvent, isPending: isDeletingEvent } = useDeleteEvent();

  const tripData = isShared ? sharedTripData : fetchedTripData;

  // Group events by day
  const eventsByDay = useMemo(() => {
    if (!tripData?.events) return [];

    const groups: { date: Date; events: Event[] }[] = [];

    tripData.events.forEach((event) => {
      const eventDate = nanosToDate(event.dateTime);
      const existingGroup = groups.find((g) => isSameDay(g.date, eventDate));

      if (existingGroup) {
        existingGroup.events.push(event);
      } else {
        groups.push({ date: eventDate, events: [event] });
      }
    });

    return groups.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tripData?.events]);

  const getShareUrl = () => {
    if (!tripData?.trip.shareToken) return "";
    return `${window.location.origin}?share=${tripData.trip.shareToken}`;
  };

  const handleCopyShareLink = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleShareViaEmail = () => {
    const shareUrl = getShareUrl();
    if (!shareUrl || !tripData) return;
    const subject = encodeURIComponent(
      `Check out my trip: ${tripData.trip.name}`,
    );
    const body = encodeURIComponent(
      `I'd like to share my trip itinerary with you:\n\n${shareUrl}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDeleteEvent = (event: Event) => {
    setDeleteError(null);
    setDeletingEvent(event);
  };

  const handleConfirmDeleteEvent = () => {
    if (deletingEvent) {
      deleteEvent(
        { id: deletingEvent.id, tripId: deletingEvent.tripId },
        {
          onSuccess: () => setDeletingEvent(null),
          onError: (err: unknown) => {
            setDeleteError(
              err instanceof Error ? err.message : "Failed to delete event",
            );
          },
        },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Plane className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Trip not found</p>
        </div>
      </div>
    );
  }

  const { trip } = tripData;

  const getEventType = (event: Event): EventType => {
    const typeString = getEventTypeString(event.eventType);
    switch (typeString) {
      case "Flight":
        return "flight";
      case "Hotel":
        return "hotel";
      default:
        return "activity";
    }
  };

  const formatLocation = (event: Event): string => {
    return [event.location.name, event.location.address]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isShared ? (
        <header className="container mx-auto px-4 lg:px-0 py-8 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Plane className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium tracking-tight text-foreground">
              Layover
            </span>
          </div>
        </header>
      ) : (
        <Header />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-0 flex-1 pb-12">
        {/* Shared Banner */}
        {isShared && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 mb-6">
            <p className="text-sm text-muted-foreground text-center">
              You are viewing a shared itinerary (read-only)
            </p>
          </div>
        )}

        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={onBack}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <h1 className="text-2xl md:text-3xl font-light text-foreground tracking-tight truncate">
                  {trip.name}
                </h1>
              </div>
              <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground ml-12 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-1">
                {trip.destination && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {trip.destination}
                  </span>
                )}
                {trip.startDate && trip.endDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {formatDisplayDate(trip.startDate)} –{" "}
                    {formatDisplayDate(trip.endDate)}
                  </span>
                )}
              </div>
            </div>
            {!isShared && (
              <div className="flex items-center gap-2 justify-end md:shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      title="Share trip"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyShareLink}>
                      <Copy className="w-4 h-4" />
                      Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareViaEmail}>
                      <Mail className="w-4 h-4" />
                      Share via email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setShowTripForm(true)}
                  title="Edit trip"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    setEditingEvent(null);
                    setShowEventForm(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Events by Day */}
        {eventsByDay.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No events yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {eventsByDay.map(({ date, events: dayEvents }) => (
              <div key={date.toISOString()}>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  {formatDayHeader(date)}
                </h2>
                <div className="space-y-3">
                  {dayEvents.map((event) => (
                    <EventCard
                      key={event.id.toString()}
                      type={getEventType(event)}
                      title={event.title}
                      date={formatDisplayTime(event.dateTime)}
                      location={formatLocation(event)}
                      detail={event.confirmationCode ?? undefined}
                      notes={event.notes ?? undefined}
                      onEdit={
                        isShared
                          ? undefined
                          : () => {
                              setEditingEvent(event);
                              setShowEventForm(true);
                            }
                      }
                      onDelete={
                        isShared ? undefined : () => handleDeleteEvent(event)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {!isShared && (
        <>
          <TripForm
            open={showTripForm}
            onClose={() => setShowTripForm(false)}
            trip={trip}
          />
          <EventForm
            open={showEventForm}
            onClose={() => {
              setShowEventForm(false);
              setEditingEvent(null);
            }}
            tripId={trip.id}
            event={editingEvent}
          />
          <AlertDialog
            open={deletingEvent !== null}
            onOpenChange={(open) =>
              !isDeletingEvent && !open && setDeletingEvent(null)
            }
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{deletingEvent?.title}"? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteError && (
                <p className="text-sm text-destructive">{deleteError}</p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingEvent}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDeleteEvent}
                  disabled={isDeletingEvent}
                >
                  {isDeletingEvent && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isDeletingEvent ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
