import { RawPoint, TrekPoint, TrekStats, RouteProcessingResult, RouteProcessingOptions } from '../types';
import { haversineDistance } from './geoUtils';
import { enrichPointsWithElevation } from './terrariumService';

const ELEVATION_HYSTERESIS_METERS = 4.0;
const MIN_DISTANCE_BETWEEN_POINTS_METERS = 1.0;

/**
 * Normalizes, sorts, enriches with Terrarium DEM elevation, and computes analytics.
 */
export async function processRoutePoints(
  rawPoints: RawPoint[],
  sourceType: 'photos' | 'gpx' | 'mixed' | 'sample',
  totalFiles: number = rawPoints.length,
  skippedFiles: number = 0,
  options: RouteProcessingOptions = {}
): Promise<RouteProcessingResult> {
  const { mergeDuplicates = false, excludedIds = new Set<string>() } = options;

  if (rawPoints.length === 0) {
    const emptyStats: TrekStats = {
      totalDistance: 0,
      elevationGain: 0,
      elevationLoss: 0,
      highestElevation: 0,
      lowestElevation: 0,
      pointsCount: 0,
      skippedFilesCount: skippedFiles,
      totalFilesCount: totalFiles,
    };
    return {
      points: [],
      allWaypoints: [],
      stats: emptyStats,
      sourceType,
    };
  }

  // 1. Sort points
  let sortedPoints = [...rawPoints];
  if (sourceType === 'photos') {
    const allHaveTimestamps = sortedPoints.every(
      (p) => typeof p.time === 'number' && !isNaN(p.time)
    );
    if (allHaveTimestamps) {
      sortedPoints.sort((a, b) => (a.time! - b.time!));
    } else {
      // Natural sort by filename
      sortedPoints.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
    }
  }

  // 2. Conditionally merge burst photos closer than 1m
  let candidatePoints: RawPoint[];
  if (mergeDuplicates) {
    candidatePoints = [sortedPoints[0]];
    for (let i = 1; i < sortedPoints.length; i++) {
      const prev = candidatePoints[candidatePoints.length - 1];
      const curr = sortedPoints[i];
      const dist = haversineDistance(prev, curr);
      if (dist >= MIN_DISTANCE_BETWEEN_POINTS_METERS) {
        candidatePoints.push(curr);
      }
    }
  } else {
    candidatePoints = sortedPoints;
  }

  // 3. Enrich with AWS Terrarium DEM tiles
  const enrichedPoints = await enrichPointsWithElevation(candidatePoints);

  // 4. Construct complete base waypoints with stable unique IDs
  let cumulativeDistance = 0;
  const allWaypoints: TrekPoint[] = [];

  for (let i = 0; i < enrichedPoints.length; i++) {
    const pt = enrichedPoints[i];
    if (i > 0) {
      const prev = enrichedPoints[i - 1];
      cumulativeDistance += haversineDistance(prev, pt);
    }

    const uniqueId =
      pt.id ||
      `wpt_${i}_${(pt.name || 'point').replace(/[^a-zA-Z0-9_-]/g, '_')}_${pt.lat.toFixed(5)}_${pt.lng.toFixed(5)}`;

    allWaypoints.push({
      id: uniqueId,
      lat: pt.lat,
      lng: pt.lng,
      time: pt.time,
      gpsAltitude: pt.gpsAltitude,
      elevation: pt.elevation,
      distance: Math.round(cumulativeDistance * 10) / 10,
      name: pt.name,
    });
  }

  // 5. Compute active route applying any excluded IDs
  const { points: activePoints, stats } = recalculateTrekRoute(
    allWaypoints,
    excludedIds,
    totalFiles,
    skippedFiles
  );

  return {
    points: activePoints,
    allWaypoints,
    stats,
    sourceType,
  };
}

/**
 * Fast in-memory recalculation of cumulative distance, elevation gain/loss,
 * peak/valley, and duration when points are selected or deselected.
 */
export function recalculateTrekRoute(
  allWaypoints: TrekPoint[],
  excludedIds: Set<string>,
  totalFilesCount?: number,
  skippedFilesCount?: number
): { points: TrekPoint[]; stats: TrekStats } {
  // Filter out excluded points
  const included = allWaypoints.filter((p) => !p.id || !excludedIds.has(p.id));

  if (included.length === 0) {
    return {
      points: [],
      stats: {
        totalDistance: 0,
        elevationGain: 0,
        elevationLoss: 0,
        highestElevation: 0,
        lowestElevation: 0,
        pointsCount: 0,
        skippedFilesCount: skippedFilesCount ?? 0,
        totalFilesCount: totalFilesCount ?? allWaypoints.length,
      },
    };
  }

  // Recalculate cumulative distance
  let cumulativeDist = 0;
  const recalculatedPoints: TrekPoint[] = [];

  for (let i = 0; i < included.length; i++) {
    const curr = included[i];
    if (i > 0) {
      const prev = included[i - 1];
      cumulativeDist += haversineDistance(prev, curr);
    }
    recalculatedPoints.push({
      ...curr,
      distance: Math.round(cumulativeDist * 10) / 10,
    });
  }

  // Recalculate elevation gain/loss with 4m hysteresis threshold
  let elevationGain = 0;
  let elevationLoss = 0;
  let highestElevation = recalculatedPoints[0].elevation;
  let lowestElevation = recalculatedPoints[0].elevation;
  let refEle = recalculatedPoints[0].elevation;

  for (let i = 0; i < recalculatedPoints.length; i++) {
    const ele = recalculatedPoints[i].elevation;
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

  // Duration
  let durationMs: number | undefined;
  const validTimes = recalculatedPoints
    .filter((p) => typeof p.time === 'number')
    .map((p) => p.time!);
  if (validTimes.length >= 2) {
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);
    if (maxTime > minTime) {
      durationMs = maxTime - minTime;
    }
  }

  const stats: TrekStats = {
    totalDistance: Math.round(cumulativeDist),
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    highestElevation: Math.round(highestElevation),
    lowestElevation: Math.round(lowestElevation),
    durationMs,
    pointsCount: recalculatedPoints.length,
    skippedFilesCount: skippedFilesCount ?? 0,
    totalFilesCount: totalFilesCount ?? allWaypoints.length,
  };

  return {
    points: recalculatedPoints,
    stats,
  };
}
