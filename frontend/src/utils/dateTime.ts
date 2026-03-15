import { format } from "date-fns";

const NANOS_PER_MS = 1_000_000n;

/**
 * Convert backend nanosecond timestamp to JS Date
 */
export function nanosToDate(timestamp: bigint): Date {
  return new Date(Number(timestamp / NANOS_PER_MS));
}

/**
 * Convert JS Date to backend nanosecond timestamp
 */
export function dateToNanos(date: Date): bigint {
  return BigInt(date.getTime()) * NANOS_PER_MS;
}

/**
 * Convert date string (and optional time string) to nanosecond timestamp
 * Used for form inputs
 */
export function dateStringToNanos(dateStr: string, timeStr?: string): bigint {
  const dt = new Date(`${dateStr}T${timeStr || "00:00"}`);
  return dateToNanos(dt);
}

/**
 * Format timestamp for HTML date input (yyyy-MM-dd)
 */
export function formatDateForInput(timestamp: bigint): string {
  return format(nanosToDate(timestamp), "yyyy-MM-dd");
}

/**
 * Format timestamp for HTML time input (HH:mm)
 */
export function formatTimeForInput(timestamp: bigint): string {
  return format(nanosToDate(timestamp), "HH:mm");
}

/**
 * Format timestamp for display: "MMM d, yyyy"
 */
export function formatDisplayDate(timestamp: bigint): string {
  return format(nanosToDate(timestamp), "MMM d, yyyy");
}

/**
 * Format timestamp for display: "h:mm a"
 */
export function formatDisplayTime(timestamp: bigint): string {
  return format(nanosToDate(timestamp), "h:mm a");
}

/**
 * Format Date for day header: "EEEE, MMMM d"
 */
export function formatDayHeader(date: Date): string {
  return format(date, "EEEE, MMMM d");
}
