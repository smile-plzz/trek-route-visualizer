import { describe, it, expect } from 'vitest';
import { processRoutePoints } from './routeProcessor';
import { RawPoint } from '../types';

describe('routeProcessor', () => {
  it('sorts photo points by timestamp', async () => {
    const raw: RawPoint[] = [
      { lat: 46.0, lng: 7.0, time: 2000, name: 'photo2.jpg', gpsAltitude: 1500 },
      { lat: 46.1, lng: 7.1, time: 1000, name: 'photo1.jpg', gpsAltitude: 1400 },
      { lat: 46.2, lng: 7.2, time: 3000, name: 'photo3.jpg', gpsAltitude: 1600 },
    ];

    const result = await processRoutePoints(raw, 'photos');
    expect(result.points[0].name).toBe('photo1.jpg');
    expect(result.points[1].name).toBe('photo2.jpg');
    expect(result.points[2].name).toBe('photo3.jpg');
  });

  it('falls back to natural filename sort when timestamps are missing', async () => {
    const raw: RawPoint[] = [
      { lat: 46.0, lng: 7.0, name: 'IMG_10.jpg', gpsAltitude: 1000 },
      { lat: 46.1, lng: 7.1, name: 'IMG_2.jpg', gpsAltitude: 1000 },
      { lat: 46.2, lng: 7.2, name: 'IMG_1.jpg', gpsAltitude: 1000 },
    ];

    const result = await processRoutePoints(raw, 'photos');
    expect(result.points[0].name).toBe('IMG_1.jpg');
    expect(result.points[1].name).toBe('IMG_2.jpg');
    expect(result.points[2].name).toBe('IMG_10.jpg');
  });

  it('merges points closer than 1 meter', async () => {
    const raw: RawPoint[] = [
      { lat: 46.000000, lng: 7.000000, time: 1000, gpsAltitude: 1000 },
      // Approx 0.05m away
      { lat: 46.0000005, lng: 7.0000005, time: 1010, gpsAltitude: 1000 },
      // Approx 100m away
      { lat: 46.001000, lng: 7.000000, time: 2000, gpsAltitude: 1050 },
    ];

    const result = await processRoutePoints(raw, 'photos');
    expect(result.points.length).toBe(2);
  });

  it('filters noise with 4m hysteresis for gain and loss', async () => {
    // Sequence of elevations:
    // 1000 -> 1002 (+2: ignored, delta < 4)
    // -> 1005 (total +5 from 1000: counts +5, new ref is 1005)
    // -> 1003 (-2: ignored, delta < 4)
    // -> 999 (total -6 from 1005: counts -6, new ref is 999)
    const raw: RawPoint[] = [
      { lat: 46.000, lng: 7.00, gpsAltitude: 1000 },
      { lat: 46.001, lng: 7.00, gpsAltitude: 1002 },
      { lat: 46.002, lng: 7.00, gpsAltitude: 1005 },
      { lat: 46.003, lng: 7.00, gpsAltitude: 1003 },
      { lat: 46.004, lng: 7.00, gpsAltitude: 999 },
    ];

    const result = await processRoutePoints(raw, 'gpx');
    expect(result.stats.elevationGain).toBe(5);
    expect(result.stats.elevationLoss).toBe(6);
    expect(result.stats.highestElevation).toBe(1005);
    expect(result.stats.lowestElevation).toBe(999);
  });
});
