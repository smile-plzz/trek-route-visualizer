import { TrekPoint, TrekStats } from '../types';
import { haversineDistance } from './geoUtils';

export const DEFAULT_MULTI_DAY_GAP_MS = 6 * 60 * 60 * 1000; // 6 hours

const ELEVATION_HYSTERESIS_METERS = 4.0;

export interface TrekDaySegment {
  dayNumber: number;
  dateLabel: string;
  points: TrekPoint[];
  stats: TrekStats;
  startIndex: number;
  endIndex: number;
}

/**
 * Splits route points into multi-day segments based on a time gap threshold.
 */
export function splitRouteByDays(
  points: TrekPoint[],
  baseStats: TrekStats,
  gapThresholdMs: number = DEFAULT_MULTI_DAY_GAP_MS
): TrekDaySegment[] {
  if (points.length === 0) return [];

  // Group indices by time gap
  const segmentIndices: { start: number; end: number }[] = [];
  let currentStart = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (
      typeof prev.time === 'number' &&
      typeof curr.time === 'number' &&
      !isNaN(prev.time) &&
      !isNaN(curr.time)
    ) {
      const timeDiff = curr.time - prev.time;
      if (timeDiff >= gapThresholdMs) {
        segmentIndices.push({ start: currentStart, end: i - 1 });
        currentStart = i;
      }
    }
  }
  segmentIndices.push({ start: currentStart, end: points.length - 1 });

  // If only 1 segment, return it as single day
  return segmentIndices.map((seg, idx) => {
    const segPoints = points.slice(seg.start, seg.end + 1);

    // Recompute cumulative distance for the day starting at 0
    let dayDist = 0;
    const dayPoints: TrekPoint[] = [];

    for (let j = 0; j < segPoints.length; j++) {
      const pt = segPoints[j];
      if (j > 0) {
        dayDist += haversineDistance(segPoints[j - 1], pt);
      }
      dayPoints.push({
        ...pt,
        distance: Math.round(dayDist * 10) / 10,
      });
    }

    // Elevation analytics
    let gain = 0;
    let loss = 0;
    let highest = dayPoints[0]?.elevation ?? 0;
    let lowest = dayPoints[0]?.elevation ?? 0;

    if (dayPoints.length > 0) {
      let ref = dayPoints[0].elevation;
      for (const p of dayPoints) {
        if (p.elevation > highest) highest = p.elevation;
        if (p.elevation < lowest) lowest = p.elevation;

        const delta = p.elevation - ref;
        if (delta >= ELEVATION_HYSTERESIS_METERS) {
          gain += delta;
          ref = p.elevation;
        } else if (delta <= -ELEVATION_HYSTERESIS_METERS) {
          loss += Math.abs(delta);
          ref = p.elevation;
        }
      }
    }

    // Duration
    let durationMs: number | undefined;
    const validTimes = dayPoints.filter((p) => typeof p.time === 'number').map((p) => p.time!);
    if (validTimes.length >= 2) {
      const minT = Math.min(...validTimes);
      const maxT = Math.max(...validTimes);
      if (maxT > minT) {
        durationMs = maxT - minT;
      }
    }

    // Date label
    let dateLabel = `Day ${idx + 1}`;
    if (validTimes.length > 0) {
      const date = new Date(validTimes[0]);
      dateLabel = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }

    const dayStats: TrekStats = {
      totalDistance: Math.round(dayDist),
      elevationGain: Math.round(gain),
      elevationLoss: Math.round(loss),
      highestElevation: Math.round(highest),
      lowestElevation: Math.round(lowest),
      durationMs,
      pointsCount: dayPoints.length,
      skippedFilesCount: 0,
      totalFilesCount: dayPoints.length,
    };

    return {
      dayNumber: idx + 1,
      dateLabel,
      points: dayPoints,
      stats: dayStats,
      startIndex: seg.start,
      endIndex: seg.end,
    };
  });
}

