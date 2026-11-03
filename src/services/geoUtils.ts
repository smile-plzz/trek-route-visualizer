import { TrekPoint } from '../types';

const EARTH_RADIUS_METERS = 6371000;

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates great-circle distance between two coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function haversineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates the forward azimuth / initial bearing from coord1 to coord2 in degrees [0, 360).
 */
export function calculateBearing(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Finds the interpolated position along the route for a given cumulative distance.
 */
export function interpolateAtDistance(
  points: TrekPoint[],
  targetDistance: number
): { lat: number; lng: number; elevation: number; segmentIndex: number } {
  if (points.length === 0) {
    return { lat: 0, lng: 0, elevation: 0, segmentIndex: 0 };
  }
  if (points.length === 1 || targetDistance <= points[0].distance) {
    return {
      lat: points[0].lat,
      lng: points[0].lng,
      elevation: points[0].elevation,
      segmentIndex: 0
    };
  }

  const lastPoint = points[points.length - 1];
  if (targetDistance >= lastPoint.distance) {
    return {
      lat: lastPoint.lat,
      lng: lastPoint.lng,
      elevation: lastPoint.elevation,
      segmentIndex: points.length - 1
    };
  }

  // Binary search or linear scan for segment
  let low = 0;
  let high = points.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (points[mid].distance <= targetDistance) {
      if (mid === points.length - 1 || points[mid + 1].distance > targetDistance) {
        const p1 = points[mid];
        const p2 = points[mid + 1];
        const segLen = p2.distance - p1.distance;
        const t = segLen > 0 ? (targetDistance - p1.distance) / segLen : 0;

        return {
          lat: p1.lat + t * (p2.lat - p1.lat),
          lng: p1.lng + t * (p2.lng - p1.lng),
          elevation: p1.elevation + t * (p2.elevation - p1.elevation),
          segmentIndex: mid
        };
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    lat: lastPoint.lat,
    lng: lastPoint.lng,
    elevation: lastPoint.elevation,
    segmentIndex: points.length - 1
  };
}

/**
 * Calculates lookahead bearing for smooth follow camera.
 * Lookahead distance = 5% of route or at least 250m ahead.
 */
export function getFollowCameraBearing(
  points: TrekPoint[],
  currentDistance: number
): number {
  if (points.length < 2) return 0;
  const totalDistance = points[points.length - 1].distance;
  const lookaheadMeters = Math.max(250, totalDistance * 0.05);
  const currentPos = interpolateAtDistance(points, currentDistance);
  
  // If we're at the very end, look backwards to keep the same final heading
  if (currentDistance >= totalDistance - 10) {
    const prevPos = interpolateAtDistance(points, Math.max(0, totalDistance - lookaheadMeters));
    return calculateBearing(prevPos, currentPos);
  }

  const aheadTargetDist = Math.min(totalDistance, currentDistance + lookaheadMeters);
  const aheadPos = interpolateAtDistance(points, aheadTargetDist);
  return calculateBearing(currentPos, aheadPos);
}

/**
 * Interpolates between two angles in degrees [0, 360) choosing the shortest rotation path.
 */
export function lerpAngle(current: number, target: number, factor: number): number {
  let diff = (target - current) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (current + diff * factor + 360) % 360;
}

