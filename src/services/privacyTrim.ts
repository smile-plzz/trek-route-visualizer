import { TrekPoint, TrekStats } from '../types';
import { haversineDistance } from './geoUtils';

const ELEVATION_HYSTERESIS_METERS = 4.0;

export interface PrivacyTrimResult {
  trimmedPoints: TrekPoint[];
  stats: TrekStats;
  startTrimMeters: number;
  endTrimMeters: number;
}

/**
 * Trims a route by excluding points within startTrimMeters of the beginning
 * and endTrimMeters of the end.
 * Fully recomputes cumulative distances, bounds, and elevation gain/loss.
 */
export function applyPrivacyTrim(
  originalPoints: TrekPoint[],
  originalStats: TrekStats,
  startTrimMeters: number,
  endTrimMeters: number
): PrivacyTrimResult {
  if (originalPoints.length < 2) {
    return {
      trimmedPoints: originalPoints,
      stats: originalStats,
      startTrimMeters: 0,
      endTrimMeters: 0,
    };
  }

  const totalDist = originalPoints[originalPoints.length - 1].distance;
  const safeStartTrim = Math.max(0, Math.min(startTrimMeters, totalDist * 0.4));
  const safeEndTrim = Math.max(0, Math.min(endTrimMeters, totalDist * 0.4));

  const minAcceptableDist = safeStartTrim;
  const maxAcceptableDist = totalDist - safeEndTrim;

  // Filter points within the privacy bounds
  let candidatePoints = originalPoints.filter(
    (p) => p.distance >= minAcceptableDist && p.distance <= maxAcceptableDist
  );

  // Guarantee at least 2 points
  if (candidatePoints.length < 2) {
    candidatePoints = [originalPoints[0], originalPoints[originalPoints.length - 1]];
  }

  // Recalculate cumulative distance starting at 0
  let cumulativeDistance = 0;
  const trimmedPoints: TrekPoint[] = [];

  for (let i = 0; i < candidatePoints.length; i++) {
    const pt = candidatePoints[i];
    if (i > 0) {
      const prev = candidatePoints[i - 1];
      const d = haversineDistance(prev, pt);
      cumulativeDistance += d;
    }

    trimmedPoints.push({
      lat: pt.lat,
      lng: pt.lng,
      time: pt.time,
      gpsAltitude: pt.gpsAltitude,
      elevation: pt.elevation,
      distance: Math.round(cumulativeDistance * 10) / 10,
      name: pt.name,
    });
  }

  // Recompute elevation gain & loss with 4m hysteresis
  let elevationGain = 0;
  let elevationLoss = 0;
  let highestElevation = trimmedPoints[0]?.elevation ?? 0;
  let lowestElevation = trimmedPoints[0]?.elevation ?? 0;

  if (trimmedPoints.length > 0) {
    let refEle = trimmedPoints[0].elevation;

    for (let i = 0; i < trimmedPoints.length; i++) {
      const ele = trimmedPoints[i].elevation;
      if (ele > highestElevation) highestElevation = ele;
      if (ele < lowestElevation) lowestElevation = ele;

      const delta = ele - refEle;
      if (delta >= ELEVATION_HYSTERESIS_METERS) {
        elevationGain += delta;
        refEle = ele;
      } else if (delta <= -ELEVATION_HYSTERESIS_METERS) {
        elevationLoss += Math.abs(delta);
        refEle = ele;
      }
    }
  }

  // Recompute duration
  let durationMs: number | undefined;
  const validTimes = trimmedPoints.filter((p) => typeof p.time === 'number').map((p) => p.time!);
  if (validTimes.length >= 2) {
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);
    if (maxTime > minTime) {
      durationMs = maxTime - minTime;
    }
  }

  const stats: TrekStats = {
    totalDistance: Math.round(cumulativeDistance),
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    highestElevation: Math.round(highestElevation),
    lowestElevation: Math.round(lowestElevation),
    durationMs,
    pointsCount: trimmedPoints.length,
    skippedFilesCount: originalStats.skippedFilesCount,
    totalFilesCount: originalStats.totalFilesCount,
  };

  return {
    trimmedPoints,
    stats,
    startTrimMeters: safeStartTrim,
    endTrimMeters: safeEndTrim,
  };
}
