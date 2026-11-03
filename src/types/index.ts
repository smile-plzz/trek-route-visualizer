export interface RawPoint {
  lat: number;
  lng: number;
  time?: number; // epoch ms
  gpsAltitude?: number; // meters from EXIF or GPX
  name?: string; // source file name
}

export interface TrekPoint {
  lat: number;
  lng: number;
  time?: number; // epoch ms
  gpsAltitude?: number;
  elevation: number; // final terrain-enriched or fallback elevation in meters
  distance: number; // cumulative meters from start
  name?: string;
}

export interface TrekStats {
  totalDistance: number; // in meters
  elevationGain: number; // in meters
  elevationLoss: number; // in meters
  highestElevation: number; // in meters
  lowestElevation: number; // in meters
  durationMs?: number; // milliseconds
  pointsCount: number;
  skippedFilesCount: number;
  totalFilesCount: number;
}

export type CameraMode = 'follow' | 'overview';
export type BasemapStyle = 'standard' | 'satellite';

export interface RouteProcessingResult {
  points: TrekPoint[];
  stats: TrekStats;
  sourceType: 'photos' | 'gpx' | 'mixed' | 'sample';
}
