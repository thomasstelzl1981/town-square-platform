/**
 * ENG-TRIP — Trip Engine Specification
 * 
 * Types, interfaces, and constants for trip detection from telematics data.
 * Supports Standard A (GPS-only) and Standard B (Ignition/Odometer).
 * 
 * NO LOGIC HERE — only types and defaults.
 */

// ─── Device Standards ────────────────────────────────────────────

/** Standard A = GPS-only, Standard B = Ignition + Odometer */
export type DeviceStandard = 'A' | 'B';

// ─── Position Data ───────────────────────────────────────────────

/** Normalized position point from any telematics source */
export interface PositionPoint {
  device_id: string;
  recorded_at: string; // ISO timestamp
  lat: number;
  lon: number;
  speed: number;       // km/h
  course: number;      // degrees 0-360
  altitude?: number;
  accuracy?: number;
  attributes: PositionAttributes;
}

/** Device-specific attributes extracted from telematics */
export interface PositionAttributes {
  ignition?: boolean;
  motion?: boolean;
  odometer?: number;    // meters
  event?: number;
  batteryLevel?: number;
  [key: string]: unknown;
}

// ─── Trip Detection Config ───────────────────────────────────────

export interface TripDetectionConfig {
  /** Minimum movement in meters to start a trip (filters parking drift) */
  min_movement_meters: number;
  /** Seconds without movement before a trip ends (Standard A) */
  stop_timeout_sec: number;
  /** GPS drift filter radius in meters (cluster nearby points) */
  drift_filter_radius_m: number;
  /** Minimum speed in km/h to consider "moving" */
  min_speed_kmh: number;
  /** Minimum trip distance in meters to be valid */
  min_trip_distance_m: number;
  /** Minimum trip duration in seconds to be valid */
  min_trip_duration_sec: number;
}

/** Sensible defaults for Central European urban/suburban driving */
export const DEFAULT_TRIP_CONFIG: TripDetectionConfig = {
  min_movement_meters: 50,
  stop_timeout_sec: 180,     // 3 minutes
  drift_filter_radius_m: 15,
  min_speed_kmh: 3,
  min_trip_distance_m: 100,
  min_trip_duration_sec: 60,
};

// ─── Trip Result ─────────────────────────────────────────────────

export type DistanceSource = 'gps' | 'odometer' | 'hybrid';

export interface TripResult {
  start_time: string;       // ISO
  end_time: string;         // ISO
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  distance_km: number;
  distance_source: DistanceSource;
  positions_count: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
}

// ─── Trip Classification ─────────────────────────────────────────

export type TripClassification = 'business' | 'private' | 'commute' | 'unclassified';

// ─── Trip State Machine (for incremental detection) ──────────────

export type TripState = 'idle' | 'moving' | 'stopping';

export interface TripDetectionState {
  state: TripState;
  current_trip_positions: PositionPoint[];
  last_movement_at: string | null;
  last_position: PositionPoint | null;
}

export const INITIAL_DETECTION_STATE: TripDetectionState = {
  state: 'idle',
  current_trip_positions: [],
  last_movement_at: null,
  last_position: null,
};
