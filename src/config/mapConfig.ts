/**
 * Configurable map tile providers and terrain sources.
 * Allows easy switching between development OSM servers and production hosted tile providers.
 */

export interface TileProviderConfig {
  name: string;
  tiles: string[];
  attribution: string;
  maxzoom: number;
}

export interface MapEngineConfig {
  basemaps: {
    standard: TileProviderConfig;
    satellite: TileProviderConfig;
  };
  terrain: {
    sourceUrl: string;
    attribution: string;
    maxzoom: number;
    encoding: 'terrarium';
  };
}

export const DEFAULT_MAP_CONFIG: MapEngineConfig = {
  basemaps: {
    standard: {
      name: 'Standard Topographic',
      tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
      maxzoom: 19,
    },
    satellite: {
      name: 'High-Resolution Satellite',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community',
      maxzoom: 19,
    },
  },
  terrain: {
    sourceUrl: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Open Data Terrain Tiles</a>',
    maxzoom: 14,
    encoding: 'terrarium',
  },
};
