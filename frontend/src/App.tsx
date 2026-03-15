import { useState } from "react";
import { Loader2, Plane, MapPin, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useActor } from "./hooks/useActor";
import { TripList } from "./components/TripList";
import { TripDetail } from "./components/TripDetail";
import { EventCard } from "./components/EventCard";
import { ProfileSetupDialog } from "./components/ProfileSetupDialog";
import { useSharedTrip, useProfile } from "./hooks/useQueries";

export default function App() {
  const [selectedTripId, setSelectedTripId] = useState<bigint | null>(null);
  const { identity, isInitializing, login, isLoggingIn } =
    useInternetIdentity();
  const { isFetching, actor } = useActor();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();

  // Check for share token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const shareToken = urlParams.get("share");

  const isAuthenticated = !!identity;
  const hasProfile = profile && profile.name;

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Shared trip view (no auth required)
  if (shareToken) {
    return <SharedTripView shareToken={shareToken} />;
  }

  // Landing page (not authenticated)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        <header className="container mx-auto px-4 lg:px-0 py-8 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2.5">
            <Plane className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium tracking-tight text-foreground">
              Layover
            </span>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 lg:px-0 flex-1 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-16 lg:gap-24 py-12 lg:py-0 relative z-10">
          {/* Left Section */}
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-light text-foreground mb-8 leading-[1.15] tracking-tight">
              Your entire trip,
              <br />
              <span className="font-normal">in one place.</span>
            </h1>

            <p className="text-base text-muted-foreground mb-12 leading-relaxed max-w-md">
              Consolidate flights, hotels, and activities into a single,
              chronological timeline. Simple, organized, effortless.
            </p>

            {/* Key Features - Color coded to match cards */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-12 text-sm">
              <div className="flex items-center gap-2 text-primary">
                <Plane className="w-4 h-4" />
                <span className="text-foreground">Flights</span>
              </div>
              <div className="flex items-center gap-2 text-destructive">
                <MapPin className="w-4 h-4" />
                <span className="text-foreground">Hotels</span>
              </div>
              <div className="flex items-center gap-2 text-accent-foreground">
                <Utensils className="w-4 h-4" />
                <span className="text-foreground">Activities</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto font-normal py-6 px-8 text-sm tracking-wide rounded-full transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Login with Internet Identity"
              )}
            </Button>
          </div>

          {/* Right Section - Timeline Preview */}
          <div className="w-full lg:flex-1 lg:max-w-md">
            <div className="relative">
              <div className="space-y-3">
                <EventCard
                  type="flight"
                  title="LAX → MIA"
                  date="Sat, March 15 · 5:30 PM"
                  location="Los Angeles to Miami"
                  detail="UA 457 · Seat 14C"
                />

                <EventCard
                  type="hotel"
                  title="Oceanview Resort"
                  date="March 15 – 18"
                  location="Miami Beach, FL"
                  detail="Check-in 3 PM"
                />

                <EventCard
                  type="activity"
                  title="Dinner Reservation"
                  date="Sun, March 16 · 7 PM"
                  location="Coastal Brasserie"
                  detail="Party of 2"
                />

                <EventCard
                  type="flight"
                  title="MIA → LAX"
                  date="Tue, March 18 · 2:15 PM"
                  location="Miami to Los Angeles"
                  detail="UA 108 · Seat 12A"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="container mx-auto px-4 lg:px-0 py-8 relative z-10" />
      </main>
    );
  }

  // Loading actor or profile
  if (!actor || isFetching || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Main app
  return (
    <>
      <ProfileSetupDialog open={!hasProfile} />
      {hasProfile ? (
        selectedTripId !== null ? (
          <TripDetail
            tripId={selectedTripId}
            onBack={() => setSelectedTripId(null)}
          />
        ) : (
          <TripList onSelectTrip={(id) => setSelectedTripId(id)} />
        )
      ) : (
        <div className="min-h-screen bg-background" />
      )}
    </>
  );
}

// Shared trip view component
function SharedTripView({ shareToken }: { shareToken: string }) {
  const { data: tripData, isLoading, error } = useSharedTrip(shareToken);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Trip not found</h1>
          <p className="text-muted-foreground">
            This shared link may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  return <TripDetail tripData={tripData} isShared />;
}
