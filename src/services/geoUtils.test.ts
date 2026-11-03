import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  calculateBearing,
  interpolateAtDistance,
  lerpAngle,
} from './geoUtils';
import { TrekPoint } from '../types';

describe('geoUtils', () => {
  it('calculates haversine distance accurately', () => {
    // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) is approx 343 km
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    const dist = haversineDistance(london, paris);
    expect(dist).toBeGreaterThan(340000);
    expect(dist).toBeLessThan(346000);
  });

  it('calculates bearings correctly', () => {
    // Due North
    const p1 = { lat: 0, lng: 0 };
    const north = { lat: 10, lng: 0 };
    expect(calculateBearing(p1, north)).toBeCloseTo(0, 1);

    // Due East
    const east = { lat: 0, lng: 10 };
    expect(calculateBearing(p1, east)).toBeCloseTo(90, 1);
  });

  it('interpolates along route points by distance', () => {
    const points: TrekPoint[] = [
      { lat: 0, lng: 0, elevation: 100, distance: 0 },
      { lat: 0, lng: 1, elevation: 200, distance: 1000 },
      { lat: 0, lng: 2, elevation: 300, distance: 2000 }
    ];

    const mid = interpolateAtDistance(points, 500);
    expect(mid.lat).toBe(0);
    expect(mid.lng).toBeCloseTo(0.5, 4);
    expect(mid.elevation).toBeCloseTo(150, 4);

    const exact = interpolateAtDistance(points, 1000);
    expect(exact.lng).toBeCloseTo(1, 4);
    expect(exact.elevation).toBeCloseTo(200, 4);
  });

  it('lerps angles across the 0/360 wrap seamlessly', () => {
    // From 350 to 10 degrees is a +20 deg turn
    const smoothed = lerpAngle(350, 10, 0.5);
    expect(smoothed).toBeCloseTo(0, 1);
  });
});

