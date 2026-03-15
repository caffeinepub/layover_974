import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    name: string;
    address?: string;
}
export interface TripWithEvents {
    trip: Trip;
    events: Array<Event>;
}
export interface Profile {
    name: string;
}
export interface Trip {
    id: bigint;
    destination?: string;
    endDate?: bigint;
    name: string;
    createdAt: bigint;
    shareToken: string;
    startDate?: bigint;
}
export interface Event {
    id: bigint;
    title: string;
    confirmationCode?: string;
    createdAt: bigint;
    tripId: bigint;
    notes?: string;
    dateTime: bigint;
    location: Location;
    eventType: EventType;
}
export enum EventType {
    Flight = "Flight",
    Hotel = "Hotel",
    Activity = "Activity"
}
export interface backendInterface {
    createEvent(tripId: bigint, eventType: EventType, title: string, dateTime: bigint, location: Location, confirmationCode: string | null, notes: string | null): Promise<bigint>;
    createTrip(name: string, destination: string | null, startDate: bigint | null, endDate: bigint | null): Promise<bigint>;
    deleteEvent(id: bigint): Promise<void>;
    deleteTrip(id: bigint): Promise<void>;
    getEvents(tripId: bigint): Promise<Array<Event>>;
    getProfile(): Promise<Profile | null>;
    getSharedTrip(shareToken: string): Promise<TripWithEvents | null>;
    getTripById(id: bigint): Promise<TripWithEvents | null>;
    getTrips(): Promise<Array<Trip>>;
    setProfile(name: string): Promise<void>;
    updateEvent(id: bigint, eventType: EventType, title: string, dateTime: bigint, location: Location, confirmationCode: string | null, notes: string | null): Promise<void>;
    updateTrip(id: bigint, name: string, destination: string | null, startDate: bigint | null, endDate: bigint | null): Promise<void>;
}
