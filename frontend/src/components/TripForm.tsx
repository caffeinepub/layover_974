import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { formatDateForInput, dateStringToNanos } from "../utils/dateTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateTrip, useUpdateTrip } from "../hooks/useQueries";
import type { Trip } from "../backend";

interface TripFormProps {
  open: boolean;
  onClose: () => void;
  trip?: Trip | null;
  onCreated?: (tripId: bigint) => void;
}

export function TripForm({ open, onClose, trip, onCreated }: TripFormProps) {
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createTrip, isPending: isCreating } = useCreateTrip();
  const { mutateAsync: updateTrip, isPending: isUpdating } = useUpdateTrip();

  const isEditing = !!trip;
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (trip) {
      setName(trip.name);
      setDestination(trip.destination ?? "");
      setStartDate(trip.startDate ? formatDateForInput(trip.startDate) : "");
      setEndDate(trip.endDate ? formatDateForInput(trip.endDate) : "");
    } else {
      setName("");
      setDestination("");
      setStartDate("");
      setEndDate("");
    }
    setDateError("");
    setError(null);
  }, [trip, open]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setDateError("");
    // Clear endDate if startDate is cleared
    if (!value) {
      setEndDate("");
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setDateError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If startDate is set, endDate is required
    if (startDate && !endDate) {
      setDateError("End date is required when start date is set");
      return;
    }

    const data = {
      name,
      destination: destination || null,
      startDate: startDate ? dateStringToNanos(startDate) : null,
      endDate: endDate ? dateStringToNanos(endDate) : null,
    };

    try {
      if (isEditing && trip) {
        await updateTrip({ id: trip.id, ...data });
        onClose();
      } else {
        const newTripId = await createTrip(data);
        onClose();
        onCreated?.(newTripId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trip");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Trip" : "New Trip"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer Vacation"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Paris, France"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground">Travel Dates</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-normal">
                  Start
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-normal">
                  End
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={startDate}
                  disabled={!startDate}
                  className={!startDate ? "opacity-50" : ""}
                />
              </div>
            </div>
            {dateError ? (
              <p className="text-xs text-destructive">{dateError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Optional. If you set a start date, end date is required.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
