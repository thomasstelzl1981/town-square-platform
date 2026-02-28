/**
 * ENG-TRIP — Trip Engine
 * 
 * Pure functions for trip detection from normalized position data.
 * NO side effects, NO DB calls, NO imports from React/Supabase.
 * 
 * Supports:
 * - Standard A: GPS movement-based detection
 * - Standard B: Ignition/Odometer-based detection
 */

import {
  type PositionPoint,
  type TripDetectionConfig,
  type TripResult,
  type DeviceStandard,
  type DistanceSource,
  DEFAULT_TRIP_CONFIG,
} from './spec';

// ─── Haversine Distance ──────────────────────────────────────────

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Calculate distance between two GPS points in meters (Haversine) */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GPS Drift Filter ────────────────────────────────────────────

/**
 * Filters GPS drift by removing points that are within `radius` meters
 * of the previous accepted point AND have speed below threshold.
 */
export function filterGpsDrift(
  positions: PositionPoint[],
  radiusM: number = DEFAULT_TRIP_CONFIG.drift_filter_radius_m,
  minSpeedKmh: number = DEFAULT_TRIP_CONFIG.min_speed_kmh
): PositionPoint[] {
  if (positions.length === 0) return [];

  const result: PositionPoint[] = [positions[0]];

  for (let i = 1; i < positions.length; i++) {
    const prev = result[result.length - 1];
    const curr = positions[i];
    const dist = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);

    // Keep if moved beyond drift radius OR speed indicates real movement
    if (dist > radiusM || curr.speed >= minSpeedKmh) {
      result.push(curr);
    }
  }

  return result;
}

// ─── Distance Calculation ────────────────────────────────────────

/** Calculate total GPS-based distance in km from a sequence of positions */
export function calculateDistanceGps(positions: PositionPoint[]): number {
  if (positions.length < 2) return 0;

  let totalM = 0;
  for (let i = 1; i < positions.length; i++) {
    totalM += haversineDistance(
      positions[i - 1].lat, positions[i - 1].lon,
      positions[i].lat, positions[i].lon
    );
  }
  return totalM / 1000;
}

/** Calculate distance from odometer delta in km */
export function calculateDistanceOdometer(
  startOdometerM: number,
  endOdometerM: number
): number {
  return Math.max(0, (endOdometerM - startOdometerM) / 1000);
}

// ─── Movement Detection ──────────────────────────────────────────

function isMoving(pos: PositionPoint, standard: DeviceStandard, config: TripDetectionConfig): boolean {
  if (standard === 'B' && pos.attributes.ignition !== undefined) {
    return pos.attributes.ignition === true;
  }
  // Standard A: speed-based
  return pos.speed >= config.min_speed_kmh;
}

function getTimestamp(pos: PositionPoint): number {
  return new Date(pos.recorded_at).getTime();
}

// ─── Trip Detection (Batch) ──────────────────────────────────────

/**
 * Detect trips from a sorted sequence of positions.
 * Positions MUST be sorted by recorded_at ascending.
 * 
 * Returns an array of detected trips.
 */
export function detectTrips(
  positions: PositionPoint[],
  config: TripDetectionConfig = DEFAULT_TRIP_CONFIG,
  standard: DeviceStandard = 'A'
): TripResult[] {
  if (positions.length < 2) return [];

  // Filter drift first
  const filtered = filterGpsDrift(positions, config.drift_filter_radius_m, config.min_speed_kmh);
  if (filtered.length < 2) return [];

  const trips: TripResult[] = [];
  let tripPositions: PositionPoint[] = [];
  let lastMovementTime = 0;

  for (const pos of filtered) {
    const moving = isMoving(pos, standard, config);
    const ts = getTimestamp(pos);

    if (moving) {
      if (tripPositions.length === 0) {
        // Trip start
        tripPositions.push(pos);
      } else {
        // Check if this is continuation or new trip after long stop
        const gap = ts - lastMovementTime;
        if (gap > config.stop_timeout_sec * 1000 && tripPositions.length > 0) {
          // Finalize previous trip, start new one
          const trip = buildTripResult(tripPositions, standard, config);
          if (trip) trips.push(trip);
          tripPositions = [pos];
        } else {
          tripPositions.push(pos);
        }
      }
      lastMovementTime = ts;
    } else {
      // Not moving
      if (tripPositions.length > 0) {
        tripPositions.push(pos); // Include stop position
        const gap = ts - lastMovementTime;
        if (gap > config.stop_timeout_sec * 1000) {
          // Trip ended
          const trip = buildTripResult(tripPositions, standard, config);
          if (trip) trips.push(trip);
          tripPositions = [];
        }
      }
    }
  }

  // Handle trip still in progress at end of data
  if (tripPositions.length >= 2) {
    const trip = buildTripResult(tripPositions, standard, config);
    if (trip) trips.push(trip);
  }

  return trips;
}

// ─── Trip Result Builder ─────────────────────────────────────────

function buildTripResult(
  positions: PositionPoint[],
  standard: DeviceStandard,
  config: TripDetectionConfig
): TripResult | null {
  if (positions.length < 2) return null;

  const first = positions[0];
  const last = positions[positions.length - 1];

  const durationSec = (getTimestamp(last) - getTimestamp(first)) / 1000;
  if (durationSec < config.min_trip_duration_sec) return null;

  // Calculate distance
  let distance_km: number;
  let distance_source: DistanceSource = 'gps';

  const firstOdo = first.attributes.odometer;
  const lastOdo = last.attributes.odometer;

  if (standard === 'B' && typeof firstOdo === 'number' && typeof lastOdo === 'number' && lastOdo > firstOdo) {
    const odoKm = calculateDistanceOdometer(firstOdo, lastOdo);
    const gpsKm = calculateDistanceGps(positions);
    
    // Use odometer if available and plausible (within 30% of GPS)
    if (gpsKm > 0 && Math.abs(odoKm - gpsKm) / gpsKm < 0.3) {
      distance_km = odoKm;
      distance_source = 'odometer';
    } else if (odoKm > 0) {
      distance_km = (odoKm + gpsKm) / 2;
      distance_source = 'hybrid';
    } else {
      distance_km = gpsKm;
    }
  } else {
    distance_km = calculateDistanceGps(positions);
  }

  if (distance_km * 1000 < config.min_trip_distance_m) return null;

  // Speed stats
  const speeds = positions.map(p => p.speed).filter(s => s > 0);
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const avgSpeed = durationSec > 0 ? (distance_km / (durationSec / 3600)) : 0;

  return {
    start_time: first.recorded_at,
    end_time: last.recorded_at,
    start_lat: first.lat,
    start_lon: first.lon,
    end_lat: last.lat,
    end_lon: last.lon,
    distance_km: Math.round(distance_km * 100) / 100,
    distance_source,
    positions_count: positions.length,
    max_speed_kmh: Math.round(maxSpeed * 10) / 10,
    avg_speed_kmh: Math.round(avgSpeed * 10) / 10,
  };
}

/**
 * Compute a summary for a given set of positions (e.g. for a single known trip).
 */
export function computeTripSummary(
  positions: PositionPoint[],
  standard: DeviceStandard = 'A'
): TripResult | null {
  return buildTripResult(positions, standard, DEFAULT_TRIP_CONFIG);
}
