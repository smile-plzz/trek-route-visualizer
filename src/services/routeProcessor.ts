import { RawPoint, TrekPoint, TrekStats, RouteProcessingResult } from '../types';
import { haversineDistance } from './geoUtils';
import { enrichPointsWithElevation } from './terrariumService';

const ELEVATION_HYSTERESIS_METERS = 4.0;
const MIN_DISTANCE_BETWEEN_POINTS_METERS = 1.0;

/**
 * Normalizes, sorts, merges, enriches, and computes analytics for a trail route.
 */
export async function processRoutePoints(
  rawPoints: RawPoint[],
  sourceType: 'photos' | 'gpx' | 'mixed' | 'sample',
  totalFiles: number = rawPoints.length,
  skippedFiles: number = 0
): Promise<RouteProcessingResult> {
  if (rawPoints.length === 0) {
    return {
      points: [],
      stats: {
        totalDistance: 0,
        elevationGain: 0,
        elevationLoss: 0,
        highestElevation: 0,
        lowestElevation: 0,
        pointsCount: 0,
        skippedFilesCount: skippedFiles,
        totalFilesCount: totalFiles,
      },
      sourceType,
    };
  }

  // 1. Sort points
  let sortedPoints = [...rawPoints];
  if (sourceType === 'photos') {
    const allHaveTimestamps = sortedPoints.every((p) => typeof p.time === 'number' && !isNaN(p.time));
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
  // If GPX, points maintain their strict track sequence

  // 2. Filter & Merge consecutive points closer than 1m
  const mergedPoints: RawPoint[] = [sortedPoints[0]];
  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = mergedPoints[mergedPoints.length - 1];
    const curr = sortedPoints[i];
    const dist = haversineDistance(prev, curr);
    if (dist >= MIN_DISTANCE_BETWEEN_POINTS_METERS) {
      mergedPoints.push(curr);
    }
  }

  // 3. Enrich with AWS Terrarium DEM tiles
  const enrichedPoints = await enrichPointsWithElevation(mergedPoints);

  // 4. Compute cumulative distance
  let cumulativeDistance = 0;
  const trekPoints: TrekPoint[] = [];

  for (let i = 0; i < enrichedPoints.length; i++) {
    const pt = enrichedPoints[i];
    if (i > 0) {
      const prev = enrichedPoints[i - 1];
      const d = haversineDistance(prev, pt);
      cumulativeDistance += d;
    }

    trekPoints.push({
      lat: pt.lat,
      lng: pt.lng,
      time: pt.time,
      gpsAltitude: pt.gpsAltitude,
      elevation: pt.elevation,
      distance: Math.round(cumulativeDistance * 10) / 10,
      name: pt.name,
    });
  }

  // 5. Compute elevation analytics (Gain & Loss with 4m hysteresis threshold)
  let elevationGain = 0;
  let elevationLoss = 0;
  let highestElevation = trekPoints[0]?.elevation ?? 0;
  let lowestElevation = trekPoints[0]?.elevation ?? 0;

  if (trekPoints.length > 0) {
    let refEle = trekPoints[0].elevation;

    for (let i = 0; i < trekPoints.length; i++) {
      const ele = trekPoints[i].elevation;
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

  // 6. Compute duration
  let durationMs: number | undefined;
  const validTimes = trekPoints.filter((p) => typeof p.time === 'number').map((p) => p.time!);
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
    pointsCount: trekPoints.length,
    skippedFilesCount: skippedFiles,
    totalFilesCount: totalFiles,
  };

  return {
    points: trekPoints,
    stats,
    sourceType,
  };
}

