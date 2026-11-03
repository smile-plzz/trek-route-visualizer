export interface RawPoint {
  id?: string;
  lat: number;
  lng: number;
  time?: number; // epoch ms
  gpsAltitude?: number; // meters from EXIF or GPX
  name?: string; // source file name
}

export interface TrekPoint {
  id?: string;
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

export type MapThemeId = 'apple-dark' | 'satellite' | 'topo' | 'clay';
export type SunLightingId = 'golden-hour' | 'alpine-morning' | 'high-noon' | 'midnight-glow';
export type TrailColorId = 'apple-orange' | 'alpine-cyan' | 'trail-lime' | 'hot-coral' | 'deep-violet';
export type WaypointDensity = 'all' | 'turns' | 'none';

export interface MapAppearanceSettings {
  theme: MapThemeId;
  lighting: SunLightingId;
  trailColor: TrailColorId;
  lineWidth: number; // 2 to 8
  waypointDensity: WaypointDensity;
}

export interface RouteProcessingOptions {
  mergeDuplicates?: boolean;
  excludedIds?: Set<string>;
}

export interface RouteProcessingResult {
  points: TrekPoint[];
  allWaypoints: TrekPoint[]; // full unexcluded pool for waypoint manager
  stats: TrekStats;
  sourceType: 'photos' | 'gpx' | 'mixed' | 'sample';
}
