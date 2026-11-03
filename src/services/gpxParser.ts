import { RawPoint } from '../types';

/**
 * Parses a GPX XML string into an array of RawPoints.
 * Uses browser native DOMParser for lightweight zero-dependency parsing.
 */
export function parseGpxString(gpxText: string, filename?: string): RawPoint[] {
  const points: RawPoint[] = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, 'application/xml');
    
    // Check for parse errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.warn('GPX Parse Error:', parserError.textContent);
    }

    // Support both <trkpt> (tracks) and <wpt> (waypoints) / <rtept> (routes)
    const elements = xmlDoc.querySelectorAll('trkpt, rtept, wpt');
    elements.forEach((el) => {
      const latStr = el.getAttribute('lat');
      const lonStr = el.getAttribute('lon');
      if (latStr && lonStr) {
        const lat = parseFloat(latStr);
        const lng = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lng)) {
          const eleEl = el.querySelector('ele');
          const timeEl = el.querySelector('time');

          const gpsAltitude = eleEl && eleEl.textContent ? parseFloat(eleEl.textContent) : undefined;
          let time: number | undefined;
          if (timeEl && timeEl.textContent) {
            const parsedTime = Date.parse(timeEl.textContent);
            if (!isNaN(parsedTime)) {
              time = parsedTime;
            }
          }

          points.push({
            lat,
            lng,
            gpsAltitude: !isNaN(gpsAltitude ?? NaN) ? gpsAltitude : undefined,
            time,
            name: filename,
          });
        }
      }
    });
  } else {
    // Regex fallback for non-DOM environments / unit tests
    const trkptRegex = /<(?:trkpt|rtept|wpt)\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/(?:trkpt|rtept|wpt)>/gi;
    let match: RegExpExecArray | null;

    while ((match = trkptRegex.exec(gpxText)) !== null) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const body = match[3];

      let gpsAltitude: number | undefined;
      const eleMatch = /<ele>([^<]+)<\/ele>/i.exec(body);
      if (eleMatch) {
        const val = parseFloat(eleMatch[1]);
        if (!isNaN(val)) gpsAltitude = val;
      }

      let time: number | undefined;
      const timeMatch = /<time>([^<]+)<\/time>/i.exec(body);
      if (timeMatch) {
        const parsed = Date.parse(timeMatch[1]);
        if (!isNaN(parsed)) time = parsed;
      }

      if (!isNaN(lat) && !isNaN(lng)) {
        points.push({
          lat,
          lng,
          gpsAltitude,
          time,
          name: filename,
        });
      }
    }
  }

  return points;
}

