import { describe, it, expect } from 'vitest';
import { parseGpxString } from './gpxParser';

describe('gpxParser', () => {
  it('parses GPX trackpoints with elevation and timestamps', () => {
    const sampleGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TestApp">
  <trk>
    <name>Matterhorn Alpine Trek</name>
    <trkseg>
      <trkpt lat="45.9763" lon="7.7491">
        <ele>1620.5</ele>
        <time>2026-08-15T08:00:00Z</time>
      </trkpt>
      <trkpt lat="45.9800" lon="7.7550">
        <ele>1750.2</ele>
        <time>2026-08-15T08:30:00Z</time>
      </trkpt>
      <trkpt lat="45.9850" lon="7.7600">
        <ele>1920.0</ele>
        <time>2026-08-15T09:15:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const points = parseGpxString(sampleGpx, 'test.gpx');
    expect(points.length).toBe(3);
    expect(points[0].lat).toBeCloseTo(45.9763, 4);
    expect(points[0].lng).toBeCloseTo(7.7491, 4);
    expect(points[0].gpsAltitude).toBe(1620.5);
    expect(points[0].time).toBe(new Date('2026-08-15T08:00:00Z').getTime());
    expect(points[0].name).toBe('test.gpx');
  });
});
