import { describe, it, expect } from 'vitest';
import { applyPrivacyTrim } from './privacyTrim';
import { TrekPoint, TrekStats } from '../types';

describe('privacyTrim', () => {
  const points: TrekPoint[] = [
    { lat: 46.000, lng: 7.000, elevation: 1000, distance: 0, name: 'Home_Camp.jpg' },
    { lat: 46.005, lng: 7.005, elevation: 1050, distance: 500, name: 'Trail_Start.jpg' },
    { lat: 46.010, lng: 7.010, elevation: 1200, distance: 1200, name: 'Midpoint_View.jpg' },
    { lat: 46.015, lng: 7.015, elevation: 1350, distance: 1800, name: 'Near_End.jpg' },
    { lat: 46.020, lng: 7.020, elevation: 1400, distance: 2400, name: 'End_Camp.jpg' },
  ];

  const stats: TrekStats = {
    totalDistance: 2400,
    elevationGain: 400,
    elevationLoss: 0,
    highestElevation: 1400,
    lowestElevation: 1000,
    pointsCount: 5,
    skippedFilesCount: 0,
    totalFilesCount: 5,
  };

  it('trims start coordinates and resets distance to zero', () => {
    // Trim initial 400m -> Point at 0m (Home_Camp) should be removed
    const result = applyPrivacyTrim(points, stats, 400, 0);

    expect(result.trimmedPoints.length).toBe(4);
    expect(result.trimmedPoints[0].name).toBe('Trail_Start.jpg');
    expect(result.trimmedPoints[0].distance).toBe(0);
    expect(result.trimmedPoints.some((p) => p.name === 'Home_Camp.jpg')).toBe(false);
  });

  it('trims end coordinates and hides the campsite', () => {
    // Trim final 500m -> Point at 2400m (End_Camp) should be removed
    const result = applyPrivacyTrim(points, stats, 0, 500);

    expect(result.trimmedPoints.length).toBe(4);
    expect(result.trimmedPoints[result.trimmedPoints.length - 1].name).toBe('Near_End.jpg');
    expect(result.trimmedPoints.some((p) => p.name === 'End_Camp.jpg')).toBe(false);
  });

  it('trims both start and end simultaneously', () => {
    const result = applyPrivacyTrim(points, stats, 400, 500);

    expect(result.trimmedPoints.length).toBe(3);
    expect(result.trimmedPoints[0].name).toBe('Trail_Start.jpg');
    expect(result.trimmedPoints[result.trimmedPoints.length - 1].name).toBe('Near_End.jpg');
    expect(result.trimmedPoints.some((p) => p.name === 'Home_Camp.jpg')).toBe(false);
    expect(result.trimmedPoints.some((p) => p.name === 'End_Camp.jpg')).toBe(false);
  });

  it('recalculates elevation stats accurately for the trimmed segment', () => {
    const result = applyPrivacyTrim(points, stats, 400, 500);
    // Trimmed points are 1050m -> 1200m -> 1350m
    expect(result.stats.lowestElevation).toBe(1050);
    expect(result.stats.highestElevation).toBe(1350);
    expect(result.stats.elevationGain).toBe(300);
  });
});
