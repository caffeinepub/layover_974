import type { Location } from "./backend";
import { EventType } from "./backend";

export interface PhotonFeature {
  type: "Feature";
  geometry: {
    coordinates: [number, number];
    type: "Point";
  };
  properties: {
    name?: string;
    type?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    osm_id?: number;
    osm_type?: string;
  };
}

export interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

export function photonToLocation(feature: PhotonFeature): Location {
  const { properties } = feature;
  const name = properties.name || "";

  // Build address from available parts
  const addressParts = [
    properties.street,
    properties.city,
    properties.state,
    properties.country,
  ].filter(Boolean);

  return {
    name,
    address: addressParts.length > 0 ? addressParts.join(", ") : undefined,
  };
}

// Helper to get event type string
export function getEventTypeString(eventType: EventType): string {
  switch (eventType) {
    case EventType.Flight:
      return "Flight";
    case EventType.Hotel:
      return "Hotel";
    default:
      return "Activity";
  }
}

// Helper to create event type from string
export function createEventType(type: string): EventType {
  switch (type) {
    case "Flight":
      return EventType.Flight;
    case "Hotel":
      return EventType.Hotel;
    default:
      return EventType.Activity;
  }
}
