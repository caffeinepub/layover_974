import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type { Location, EventType } from "../backend";

export function useTrips() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["trips", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getTrips();
    },
    enabled: !!actor && !!identity,
  });
}

export function useTrip(tripId: bigint | null) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["trip", tripId?.toString(), identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || tripId === null) throw new Error("Actor not ready");
      const result = await actor.getTripById(tripId);
      return result ?? null;
    },
    enabled: !!actor && !!identity && tripId !== null,
  });
}

export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      name,
      destination,
      startDate,
      endDate,
    }: {
      name: string;
      destination: string | null;
      startDate: bigint | null;
      endDate: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createTrip(name, destination, startDate, endDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useUpdateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      destination,
      startDate,
      endDate,
    }: {
      id: bigint;
      name: string;
      destination: string | null;
      startDate: bigint | null;
      endDate: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateTrip(id, name, destination, startDate, endDate);
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["trips", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "trip",
          variables.id.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useDeleteTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteTrip(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trips", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      tripId,
      eventType,
      title,
      dateTime,
      location,
      confirmationCode,
      notes,
    }: {
      tripId: bigint;
      eventType: EventType;
      title: string;
      dateTime: bigint;
      location: Location;
      confirmationCode: string | null;
      notes: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createEvent(
        tripId,
        eventType,
        title,
        dateTime,
        location,
        confirmationCode,
        notes,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "events",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "trip",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useUpdateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      tripId,
      eventType,
      title,
      dateTime,
      location,
      confirmationCode,
      notes,
    }: {
      id: bigint;
      tripId: bigint;
      eventType: EventType;
      title: string;
      dateTime: bigint;
      location: Location;
      confirmationCode: string | null;
      notes: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateEvent(
        id,
        eventType,
        title,
        dateTime,
        location,
        confirmationCode,
        notes,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "events",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "trip",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useDeleteEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ id, tripId }: { id: bigint; tripId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteEvent(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "events",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "trip",
          variables.tripId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

export function useSharedTrip(shareToken: string | null) {
  const { actor } = useActor();

  return useQuery({
    queryKey: ["sharedTrip", shareToken],
    queryFn: async () => {
      if (!actor || !shareToken) throw new Error("Actor not ready");
      const result = await actor.getSharedTrip(shareToken);
      return result ?? null;
    },
    enabled: !!actor && !!shareToken,
  });
}

export function useProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getProfile();
      return result ?? null;
    },
    enabled: !!actor && !!identity,
  });
}

export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}
