import { describe, it, expect } from 'vitest';
import { buildGpxXml } from './gpxExporter';
import { parseGpxString } from './gpxParser';
import { TrekPoint } from '../types';

describe('gpxExporter', () => {
  const samplePoints: TrekPoint[] = [
    {
      lat: 45.9763,
      lng: 7.7491,
      elevation: 1620.5,
      distance: 0,
      time: 1723708800000,
      name: 'Start_Point.jpg',
    },
    {
      lat: 45.9850,
      lng: 7.7600,
      elevation: 1920.0,
      distance: 1200,
      time: 1723712400000,
      name: 'Summit_Pass.jpg',
    },
  ];

  it('generates valid GPX 1.1 XML string', () => {
    const xml = buildGpxXml(samplePoints, 'Matterhorn Ascent');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<gpx version="1.1"');
    expect(xml).toContain('<name>Matterhorn Ascent</name>');
    expect(xml).toContain('<trkpt lat="45.976300" lon="7.749100">');
    expect(xml).toContain('<ele>1620.5</ele>');
    expect(xml).toContain('<time>2024-08-15T08:00:00.000Z</time>');
  });

  it('maintains roundtrip data fidelity when re-parsed by gpxParser', () => {
    const xml = buildGpxXml(samplePoints, 'Roundtrip Test');
    const parsed = parseGpxString(xml);

    expect(parsed.length).toBe(2);
    expect(parsed[0].lat).toBeCloseTo(45.9763, 4);
    expect(parsed[0].lng).toBeCloseTo(7.7491, 4);
    expect(parsed[0].gpsAltitude).toBeCloseTo(1620.5, 1);
    expect(parsed[0].time).toBe(1723708800000);

    expect(parsed[1].lat).toBeCloseTo(45.985, 4);
    expect(parsed[1].lng).toBeCloseTo(7.76, 4);
    expect(parsed[1].gpsAltitude).toBeCloseTo(1920.0, 1);
    expect(parsed[1].time).toBe(1723712400000);
  });
});

