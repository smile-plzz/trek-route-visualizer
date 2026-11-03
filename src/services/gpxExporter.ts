import { TrekPoint } from '../types';

/**
 * Builds a standard GPX 1.1 XML string from an array of TrekPoints.
 * Compatible with Garmin, Strava, Gaia GPS, AllTrails, and Google Earth.
 */
export function buildGpxXml(
  points: TrekPoint[],
  trekName: string = 'Trek Route Visualizer Track'
): string {
  const nowIso = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trek Route Visualizer (https://github.com/smile-plzz/trektrack-photo-route)"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(trekName)}</name>
    <time>${nowIso}</time>
  </metadata>
  <trk>
    <name>${escapeXml(trekName)}</name>
    <trkseg>
`;

  for (const pt of points) {
    xml += `      <trkpt lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}">\n`;
    xml += `        <ele>${pt.elevation.toFixed(1)}</ele>\n`;
    if (typeof pt.time === 'number' && !isNaN(pt.time)) {
      xml += `        <time>${new Date(pt.time).toISOString()}</time>\n`;
    }
    if (pt.name) {
      xml += `        <name>${escapeXml(pt.name)}</name>\n`;
    }
    xml += `      </trkpt>\n`;
  }

  xml += `    </trkseg>
  </trk>
</gpx>`;

  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Initiates a browser download of the route as a standard .gpx file.
 */
export function downloadGpx(
  points: TrekPoint[],
  filename: string = `trek_route_${Date.now()}.gpx`
): void {
  const gpxContent = buildGpxXml(points);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

