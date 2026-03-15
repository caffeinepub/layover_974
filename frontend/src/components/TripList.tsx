import { useState } from "react";
import { formatDisplayDate } from "../utils/dateTime";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Calendar,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTrips, useDeleteTrip } from "../hooks/useQueries";
import { Header } from "./Header";
import { TripForm } from "./TripForm";
import type { Trip } from "../backend";

interface TripListProps {
  onSelectTrip: (tripId: bigint) => void;
}

export function TripList({ onSelectTrip }: TripListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTripId, setDeletingTripId] = useState<bigint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { data: trips, isLoading } = useTrips();
  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();

  const handleDeleteClick = (e: React.MouseEvent, tripId: bigint) => {
    e.stopPropagation();
    setDeleteError(null);
    setDeletingTripId(tripId);
  };

  const handleEditClick = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setShowForm(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTripId) {
      deleteTrip(deletingTripId, {
        onSuccess: () => setDeletingTripId(null),
        onError: (err: unknown) => {
          setDeleteError(
            err instanceof Error ? err.message : "Failed to delete trip",
          );
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-0 flex-1 pb-12">
        {/* Page Title */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-foreground tracking-tight">
              My Trips
            </h1>
            {trips && trips.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {trips.length} {trips.length === 1 ? "trip" : "trips"}
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              setEditingTrip(null);
              setShowForm(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
          >
            <Plus className="w-4 h-4" />
            Create Trip
          </Button>
        </div>

        {/* Trip List */}
        {trips && trips.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plane className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No trips yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips?.map((trip) => (
              <div
                key={trip.id.toString()}
                className="group relative rounded-xl border border-border bg-card p-5 cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm overflow-hidden"
                onClick={() => onSelectTrip(trip.id)}
              >
                {/* Background decoration like EventCard */}
                <div className="absolute -right-6 -top-6 text-primary opacity-[0.05] pointer-events-none">
                  <MapPin className="w-32 h-32" strokeWidth={1} />
                </div>

                <div className="relative flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-foreground text-lg truncate pr-4">
                      {trip.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {trip.destination && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {trip.destination}
                        </span>
                      )}
                      {trip.startDate && trip.endDate && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDisplayDate(trip.startDate)} –{" "}
                          {formatDisplayDate(trip.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleEditClick(e, trip)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleDeleteClick(e, trip.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TripForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTrip(null);
        }}
        trip={editingTrip ?? undefined}
        onCreated={(tripId) => onSelectTrip(tripId)}
      />

      <AlertDialog
        open={deletingTripId !== null}
        onOpenChange={(open) => !isDeleting && !open && setDeletingTripId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
