import { MapThemeId, SunLightingId, TrailColorId, MapAppearanceSettings } from '../types';

export interface ThemeDefinition {
  id: MapThemeId;
  name: string;
  description: string;
  tiles: string[];
  attribution: string;
  maxzoom: number;
  previewBg: string;
}

export interface LightingDefinition {
  id: SunLightingId;
  name: string;
  description: string;
  azimuth: number;
  altitude: number;
  skyColor: string;
  horizonColor: string;
  fogColor: string;
  horizonBlend: number;
}

export interface TrailColorDefinition {
  id: TrailColorId;
  name: string;
  hex: string;
  glowHex: string;
}

export const MAP_THEMES: Record<MapThemeId, ThemeDefinition> = {
  satellite: {
    id: 'satellite',
    name: 'High-Res Satellite',
    description: 'Pristine aerial photography draped over 3D mountain relief',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Esri, Maxar, Earthstar Geographics',
    maxzoom: 19,
    previewBg: 'from-emerald-950 via-stone-900 to-amber-950',
  },
  'apple-dark': {
    id: 'apple-dark',
    name: 'Apple Minimal Dark',
    description: 'Clean dark vector relief with muted high-contrast topography',
    tiles: ['https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'],
    attribution: '© Carto, © OpenStreetMap contributors',
    maxzoom: 19,
    previewBg: 'from-slate-950 via-gray-900 to-black',
  },
  topo: {
    id: 'topo',
    name: 'Alpine Topo & Contours',
    description: 'Traditional mountaineering topographic maps with contour lines',
    tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    attribution: '© OpenTopoMap, © OpenStreetMap contributors',
    maxzoom: 17,
    previewBg: 'from-amber-900 via-stone-800 to-amber-950',
  },
  clay: {
    id: 'clay',
    name: 'Warm Clay Minimal',
    description: 'Monochromatic warm paper relief for architectural elegance',
    tiles: ['https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'],
    attribution: '© Carto, © OpenStreetMap contributors',
    maxzoom: 19,
    previewBg: 'from-stone-700 via-amber-900 to-stone-800',
  },
};

export const SUN_LIGHTING_MODES: Record<SunLightingId, LightingDefinition> = {
  'golden-hour': {
    id: 'golden-hour',
    name: 'Golden Hour Sunset',
    description: 'Warm, low-angle alpine glow with deep amber mountain shadows',
    azimuth: 285,
    altitude: 18,
    skyColor: '#1e1b4b',
    horizonColor: '#7c2d12',
    fogColor: '#451a03',
    horizonBlend: 0.75,
  },
  'alpine-morning': {
    id: 'alpine-morning',
    name: 'Alpine Morning Dawn',
    description: 'Crisp dawn light with soft lavender and rose mountain atmosphere',
    azimuth: 85,
    altitude: 22,
    skyColor: '#0f172a',
    horizonColor: '#4c1d95',
    fogColor: '#2e1065',
    horizonBlend: 0.7,
  },
  'high-noon': {
    id: 'high-noon',
    name: 'High Noon Clear Sky',
    description: 'Overhead bright alpine sun with sharp peak definition',
    azimuth: 180,
    altitude: 72,
    skyColor: '#0284c7',
    horizonColor: '#0369a1',
    fogColor: '#38bdf8',
    horizonBlend: 0.5,
  },
  'midnight-glow': {
    id: 'midnight-glow',
    name: 'Midnight Neon Glow',
    description: 'Dramatic nocturnal deep indigo atmosphere with neon route glow',
    azimuth: 0,
    altitude: 5,
    skyColor: '#020617',
    horizonColor: '#0f172a',
    fogColor: '#1e1b4b',
    horizonBlend: 0.85,
  },
};

export const TRAIL_COLORS: Record<TrailColorId, TrailColorDefinition> = {
  'apple-orange': {
    id: 'apple-orange',
    name: 'Apple Orange',
    hex: '#ff9500',
    glowHex: '#fbbf24',
  },
  'alpine-cyan': {
    id: 'alpine-cyan',
    name: 'Alpine Cyan',
    hex: '#00e5ff',
    glowHex: '#38bdf8',
  },
  'trail-lime': {
    id: 'trail-lime',
    name: 'Trail Lime',
    hex: '#30d158',
    glowHex: '#34d399',
  },
  'hot-coral': {
    id: 'hot-coral',
    name: 'Hot Coral',
    hex: '#ff375f',
    glowHex: '#f43f5e',
  },
  'deep-violet': {
    id: 'deep-violet',
    name: 'Deep Violet',
    hex: '#bf5af2',
    glowHex: '#c084fc',
  },
};

export const DEFAULT_APPEARANCE_SETTINGS: MapAppearanceSettings = {
  theme: 'satellite',
  lighting: 'golden-hour',
  trailColor: 'alpine-cyan',
  lineWidth: 4.5,
  waypointDensity: 'all',
};
