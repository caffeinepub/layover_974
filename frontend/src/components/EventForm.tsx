import { useState, useEffect, useRef } from "react";
import { Loader2, Search, MapPin } from "lucide-react";
import {
  dateStringToNanos,
  formatDateForInput,
  formatTimeForInput,
} from "../utils/dateTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreateEvent, useUpdateEvent } from "../hooks/useQueries";
import type { Event } from "../backend";
import {
  getEventTypeString,
  createEventType,
  photonToLocation,
  type PhotonFeature,
  type PhotonResponse,
} from "../types";

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  tripId: bigint;
  event?: Event | null;
}

export function EventForm({ open, onClose, tripId, event }: EventFormProps) {
  const [eventType, setEventType] = useState<string>("Activity");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Location search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PhotonFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { mutateAsync: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutateAsync: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const isEditing = !!event;
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (event) {
      setEventType(getEventTypeString(event.eventType));
      setTitle(event.title);
      setDate(formatDateForInput(event.dateTime));
      setTime(formatTimeForInput(event.dateTime));
      setLocationName(event.location.name);
      setLocationAddress(event.location.address ?? "");
      setConfirmationCode(event.confirmationCode ?? "");
      setNotes(event.notes ?? "");
    } else {
      setEventType("Activity");
      setTitle("");
      setDate("");
      setTime("");
      setLocationName("");
      setLocationAddress("");
      setConfirmationCode("");
      setNotes("");
    }
    setError(null);
  }, [event, open]);

  // Debounced location search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(false);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`,
        );
        if (!response.ok) {
          throw new Error("Search request failed");
        }
        const data: PhotonResponse = await response.json();
        setSearchResults(data.features);
      } catch (error) {
        console.error("Location search failed:", error);
        setSearchResults([]);
        setSearchError(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectLocation = (feature: PhotonFeature) => {
    const location = photonToLocation(feature);
    setLocationName(location.name);
    setLocationAddress(location.address ?? "");
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const formatSearchResult = (feature: PhotonFeature): string => {
    const parts = [
      feature.properties.name,
      feature.properties.city,
      feature.properties.state,
      feature.properties.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = {
      tripId,
      eventType: createEventType(eventType),
      title,
      dateTime: dateStringToNanos(date, time),
      location: {
        name: locationName,
        address: locationAddress || undefined,
      },
      confirmationCode: confirmationCode || null,
      notes: notes || null,
    };

    try {
      if (isEditing && event) {
        await updateEvent({ id: event.id, ...data });
      } else {
        await createEvent(data);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Add Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Flight">Flight</SelectItem>
                <SelectItem value="Hotel">Hotel</SelectItem>
                <SelectItem value="Activity">Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Flight to Paris"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground">Date & Time</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-normal">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time" className="text-xs font-normal">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Location</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    Search
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3 border-b">
                    <Input
                      placeholder="Search for a place..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : searchError ? (
                      <p className="text-sm text-destructive text-center py-6">
                        Search failed. Please try again.
                      </p>
                    ) : searchResults.length > 0 ? (
                      <div className="py-1">
                        {searchResults.map((feature, index) => (
                          <button
                            key={`${feature.properties.osm_id}-${index}`}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-muted flex items-start gap-2"
                            onClick={() => handleSelectLocation(feature)}
                          >
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <span className="text-sm">
                              {formatSearchResult(feature)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery.trim() ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No results found
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Type to search for a location
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="locationName" className="text-xs font-normal">
                  Venue / Place Name
                </Label>
                <Input
                  id="locationName"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="JFK Airport, Hilton Hotel, etc."
                  maxLength={300}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="locationAddress"
                  className="text-xs font-normal"
                >
                  Address
                </Label>
                <Input
                  id="locationAddress"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="123 Main St, New York, NY"
                  maxLength={300}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Type manually or use Search to auto-fill
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmationCode">Confirmation Code</Label>
            <Input
              id="confirmationCode"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="ABC123"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              maxLength={2000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
