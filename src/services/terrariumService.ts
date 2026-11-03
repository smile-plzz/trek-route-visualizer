/**
 * AWS Open Data Terrarium DEM elevation tile decoder.
 * URL format: https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
 * Formula: h = 256 * R + G + (B / 256) - 32768
 */

export const TERRARIUM_ZOOM = 12;

export function decodeTerrariumRGB(r: number, g: number, b: number): number {
  return 256 * r + g + b / 256 - 32768;
}

export interface TileCoord {
  z: number;
  x: number;
  y: number;
  px: number; // 0..255 pixel within tile
  py: number; // 0..255 pixel within tile
}

/**
 * Converts geographic coordinates to Web Mercator tile index and pixel position.
 */
export function latLngToTileCoord(
  lat: number,
  lng: number,
  zoom: number = TERRARIUM_ZOOM
): TileCoord {
  const n = Math.pow(2, zoom);
  const xExact = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yExact =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const x = Math.floor(xExact);
  const y = Math.floor(yExact);

  const px = Math.min(255, Math.max(0, Math.floor((xExact - x) * 256)));
  const py = Math.min(255, Math.max(0, Math.floor((yExact - y) * 256)));

  return { z: zoom, x, y, px, py };
}

// In-memory tile cache to avoid re-fetching duplicate tiles across route points
const tileDataCache = new Map<string, ImageData>();

/**
 * Fetches and decodes an AWS Terrarium DEM PNG tile into raw ImageData.
 */
export async function getTerrariumTileData(
  z: number,
  x: number,
  y: number
): Promise<ImageData | null> {
  const key = `${z}/${x}/${y}`;
  if (tileDataCache.has(key)) {
    return tileDataCache.get(key)!;
  }

  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return null; // Node/test environment fallback
  }

  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load tile ${url}`));
    });

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, 256, 256);
    tileDataCache.set(key, imageData);
    return imageData;
  } catch (err) {
    console.warn(`Could not load Terrarium tile ${key}:`, err);
    return null;
  }
}

/**
 * Looks up elevation in meters for a given coordinate.
 * Falls back to fallbackAltitude if tile lookup fails.
 */
export async function lookupElevation(
  lat: number,
  lng: number,
  fallbackAltitude?: number
): Promise<number> {
  const tileCoord = latLngToTileCoord(lat, lng, TERRARIUM_ZOOM);
  const tileData = await getTerrariumTileData(
    tileCoord.z,
    tileCoord.x,
    tileCoord.y
  );

  if (!tileData) {
    return fallbackAltitude ?? 0;
  }

  const pixelIndex = (tileCoord.py * 256 + tileCoord.px) * 4;
  const r = tileData.data[pixelIndex];
  const g = tileData.data[pixelIndex + 1];
  const b = tileData.data[pixelIndex + 2];

  const elevation = decodeTerrariumRGB(r, g, b);
  return Math.round(elevation * 10) / 10;
}

/**
 * Batch enriches a list of points with elevation from Terrarium tiles.
 */
export async function enrichPointsWithElevation<
  T extends { lat: number; lng: number; gpsAltitude?: number }
>(points: T[]): Promise<(T & { elevation: number })[]> {
  // Pre-fetch all distinct tiles in parallel
  const uniqueTileKeys = new Set<string>();
  const pointTileCoords = points.map((p) => {
    const coord = latLngToTileCoord(p.lat, p.lng, TERRARIUM_ZOOM);
    uniqueTileKeys.add(`${coord.z}/${coord.x}/${coord.y}`);
    return coord;
  });

  await Promise.all(
    Array.from(uniqueTileKeys).map((key) => {
      const [z, x, y] = key.split('/').map(Number);
      return getTerrariumTileData(z, x, y);
    })
  );

  return points.map((p, idx) => {
    const tileCoord = pointTileCoords[idx];
    const key = `${tileCoord.z}/${tileCoord.x}/${tileCoord.y}`;
    const tileData = tileDataCache.get(key);

    if (tileData) {
      const pixelIndex = (tileCoord.py * 256 + tileCoord.px) * 4;
      const r = tileData.data[pixelIndex];
      const g = tileData.data[pixelIndex + 1];
      const b = tileData.data[pixelIndex + 2];
      const elevation = decodeTerrariumRGB(r, g, b);
      return {
        ...p,
        elevation: Math.round(elevation * 10) / 10,
      };
    }

    return {
      ...p,
      elevation: p.gpsAltitude ?? 0,
    };
  });
}
