import { describe, it, expect } from 'vitest';
import { splitRouteByDays, DEFAULT_MULTI_DAY_GAP_MS } from './multiDaySplitter';
import { TrekPoint, TrekStats } from '../types';

describe('multiDaySplitter', () => {
  const baseStats: TrekStats = {
    totalDistance: 10000,
    elevationGain: 800,
    elevationLoss: 200,
    highestElevation: 2500,
    lowestElevation: 1700,
    pointsCount: 4,
    skippedFilesCount: 0,
    totalFilesCount: 4,
  };

  it('keeps single-day trek as one segment when gaps are below threshold', () => {
    const t0 = 1723708800000; // 08:00
    const t1 = t0 + 2 * 3600 * 1000; // 10:00 (2h gap)
    const t2 = t1 + 3 * 3600 * 1000; // 13:00 (3h gap)

    const points: TrekPoint[] = [
      { lat: 46.0, lng: 7.0, elevation: 1700, distance: 0, time: t0 },
      { lat: 46.1, lng: 7.1, elevation: 2000, distance: 3000, time: t1 },
      { lat: 46.2, lng: 7.2, elevation: 2400, distance: 6000, time: t2 },
    ];

    const days = splitRouteByDays(points, baseStats);
    expect(days.length).toBe(1);
    expect(days[0].dayNumber).toBe(1);
    expect(days[0].points.length).toBe(3);
  });

  it('splits into multiple days when time gap exceeds 6 hours (overnight camp)', () => {
    const day1Start = 1723708800000; // Day 1 08:00
    const day1Lunch = day1Start + 2 * 3600 * 1000; // Day 1 10:00 (2h gap)
    const day2Start = day1Lunch + 16 * 3600 * 1000; // Day 2 08:00 (16h overnight gap)
    const day2Summit = day2Start + 2 * 3600 * 1000; // Day 2 10:00 (2h gap)

    const points: TrekPoint[] = [
      { lat: 46.00, lng: 7.00, elevation: 1500, distance: 0, time: day1Start },
      { lat: 46.05, lng: 7.05, elevation: 2100, distance: 5000, time: day1Lunch },
      // Overnight gap
      { lat: 46.06, lng: 7.06, elevation: 2100, distance: 5100, time: day2Start },
      { lat: 46.12, lng: 7.12, elevation: 2800, distance: 11000, time: day2Summit },
    ];

    const days = splitRouteByDays(points, baseStats);
    expect(days.length).toBe(2);

    // Day 1
    expect(days[0].dayNumber).toBe(1);
    expect(days[0].points.length).toBe(2);
    expect(days[0].points[0].elevation).toBe(1500);
    expect(days[0].stats.elevationGain).toBe(600);

    // Day 2 (distance resets to 0 for the day)
    expect(days[1].dayNumber).toBe(2);
    expect(days[1].points.length).toBe(2);
    expect(days[1].points[0].distance).toBe(0);
    expect(days[1].stats.elevationGain).toBe(700);
  });
});
