import React, { useEffect, useRef } from 'react';
import maplibregl, { Map, LngLatBounds } from 'maplibre-gl';
import { TrekPoint, CameraMode, BasemapStyle, MapAppearanceSettings } from '../types';
import { getFollowCameraBearing, lerpAngle } from '../services/geoUtils';
import { DEFAULT_MAP_CONFIG } from '../config/mapConfig';
import {
  MAP_THEMES,
  SUN_LIGHTING_MODES,
  TRAIL_COLORS,
  DEFAULT_APPEARANCE_SETTINGS,
} from '../config/mapThemes';

interface Map3DProps {
  points: TrekPoint[];
  travelerPosition: { lat: number; lng: number; elevation: number } | null;
  cameraMode: CameraMode;
  basemapStyle?: BasemapStyle;
  appearanceSettings?: MapAppearanceSettings;
  terrainExaggeration: number;
  onMapLoaded?: (mapInstance: Map) => void;
  flyToCoord?: { lat: number; lng: number; zoom?: number } | null;
}

export const Map3D: React.FC<Map3DProps> = ({
  points,
  travelerPosition,
  cameraMode,
  basemapStyle = 'satellite',
  appearanceSettings = DEFAULT_APPEARANCE_SETTINGS,
  terrainExaggeration,
  onMapLoaded,
  flyToCoord,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const currentBearingRef = useRef<number>(0);
  const isMapLoadedRef = useRef<boolean>(false);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] =
      points.length > 0 ? [points[0].lng, points[0].lat] : [7.7082, 45.9928];

    // Priority to appearanceSettings.theme if available
    const themeDef = MAP_THEMES[appearanceSettings.theme] || MAP_THEMES.satellite;
    const tiles = themeDef.tiles;
    const attribution = themeDef.attribution;
    const terrainConfig = DEFAULT_MAP_CONFIG.terrain;
    const lighting = SUN_LIGHTING_MODES[appearanceSettings.lighting] || SUN_LIGHTING_MODES['golden-hour'];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      preserveDrawingBuffer: true, // CRITICAL FOR VIDEO RECORDING
      style: {
        version: 8,
        sources: {
          'basemap-source': {
            type: 'raster',
            tiles,
            tileSize: 256,
            attribution,
            maxzoom: themeDef.maxzoom,
          },
          'terrarium-dem': {
            type: 'raster-dem',
            tiles: [terrainConfig.sourceUrl],
            tileSize: 256,
            encoding: terrainConfig.encoding,
            attribution: terrainConfig.attribution,
            maxzoom: terrainConfig.maxzoom,
          },
        },
        layers: [
          {
            id: 'basemap-layer',
            type: 'raster',
            source: 'basemap-source',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
        terrain: {
          source: 'terrarium-dem',
          exaggeration: terrainExaggeration,
        },
        sky: {
          'sky-color': lighting.skyColor,
          'sky-horizon-blend': lighting.horizonBlend,
          'horizon-color': lighting.horizonColor,
          'horizon-fog-blend': 0.7,
          'fog-color': lighting.fogColor,
          'fog-ground-blend': 0.5,
        },
      },
      center: initialCenter,
      zoom: 13,
      pitch: 55,
      bearing: 15,
      maxPitch: 85,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      isMapLoadedRef.current = true;
      mapRef.current = map;
      onMapLoaded?.(map);
      setupRouteLayers(map, points, appearanceSettings);
    });

    return () => {
      isMapLoadedRef.current = false;
      map.remove();
    };
  }, []);

  // Update Basemap Tiles on theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;

    const themeDef = MAP_THEMES[appearanceSettings.theme];
    if (!themeDef) return;

    const source = map.getSource('basemap-source') as maplibregl.RasterTileSource;
    if (source && source.setTiles) {
      source.setTiles(themeDef.tiles);
    }
  }, [appearanceSettings.theme]);

  // Update Lighting / Sky Atmosphere
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;

    const lighting = SUN_LIGHTING_MODES[appearanceSettings.lighting];
    if (!lighting || typeof map.setSky !== 'function') return;

    try {
      map.setSky({
        'sky-color': lighting.skyColor,
        'sky-horizon-blend': lighting.horizonBlend,
        'horizon-color': lighting.horizonColor,
        'horizon-fog-blend': 0.7,
        'fog-color': lighting.fogColor,
        'fog-ground-blend': 0.5,
      });
    } catch (e) {
      console.warn('Could not dynamically update sky:', e);
    }
  }, [appearanceSettings.lighting]);

  // Update Trail Colors & Width
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;

    const trailDef = TRAIL_COLORS[appearanceSettings.trailColor] || TRAIL_COLORS['alpine-cyan'];

    if (map.getLayer('route-line')) {
      map.setPaintProperty('route-line', 'line-color', trailDef.hex);
      map.setPaintProperty('route-line', 'line-width', appearanceSettings.lineWidth);
    }
    if (map.getLayer('route-glow')) {
      map.setPaintProperty('route-glow', 'line-color', trailDef.glowHex);
      map.setPaintProperty('route-glow', 'line-width', appearanceSettings.lineWidth * 2.2);
    }

    // Update waypoint density filter
    if (map.getLayer('waypoints-layer')) {
      if (appearanceSettings.waypointDensity === 'none') {
        map.setLayoutProperty('waypoints-layer', 'visibility', 'none');
      } else if (appearanceSettings.waypointDensity === 'turns') {
        map.setLayoutProperty('waypoints-layer', 'visibility', 'visible');
        map.setFilter('waypoints-layer', ['any', ['get', 'isStart'], ['get', 'isEnd']]);
      } else {
        map.setLayoutProperty('waypoints-layer', 'visibility', 'visible');
        map.setFilter('waypoints-layer', null);
      }
    }
  }, [appearanceSettings.trailColor, appearanceSettings.lineWidth, appearanceSettings.waypointDensity]);

  // Update Terrain Exaggeration
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;
    map.setTerrain({
      source: 'terrarium-dem',
      exaggeration: terrainExaggeration,
    });
  }, [terrainExaggeration]);

  // Handle external fly-to waypoint triggers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current || !flyToCoord) return;
    map.flyTo({
      center: [flyToCoord.lng, flyToCoord.lat],
      zoom: flyToCoord.zoom || 15.5,
      pitch: 65,
      bearing: map.getBearing(),
      duration: 1400,
      essential: true,
    });
  }, [flyToCoord]);

  // Helper to configure Route, Waypoints, and Traveler on the map
  const setupRouteLayers = (
    map: Map,
    pts: TrekPoint[],
    currAppearance: MapAppearanceSettings
  ) => {
    if (pts.length < 2) return;

    const coordinates = pts.map((p) => [p.lng, p.lat]);
    const trailDef = TRAIL_COLORS[currAppearance.trailColor] || TRAIL_COLORS['alpine-cyan'];

    // 1. Route Line Source & Layer
    const routeGeoJson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      ],
    };

    if (map.getSource('route-source')) {
      (map.getSource('route-source') as maplibregl.GeoJSONSource).setData(routeGeoJson);
    } else {
      map.addSource('route-source', {
        type: 'geojson',
        data: routeGeoJson,
      });

      // Glow backing
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': trailDef.glowHex,
          'line-width': currAppearance.lineWidth * 2.2,
          'line-opacity': 0.5,
          'line-blur': 4,
        },
      });

      // Core crisp path
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': trailDef.hex,
          'line-width': currAppearance.lineWidth,
          'line-opacity': 0.98,
        },
      });
    }

    // 2. Waypoint Dots (Small Dots at every coordinate)
    const waypointsGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: pts.map((p, index) => ({
        type: 'Feature',
        properties: {
          index,
          elevation: p.elevation,
          name: p.name,
          isStart: index === 0,
          isEnd: index === pts.length - 1,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
      })),
    };

    if (map.getSource('waypoints-source')) {
      (map.getSource('waypoints-source') as maplibregl.GeoJSONSource).setData(waypointsGeoJson);
    } else {
      map.addSource('waypoints-source', {
        type: 'geojson',
        data: waypointsGeoJson,
      });

      map.addLayer({
        id: 'waypoints-layer',
        type: 'circle',
        source: 'waypoints-source',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['get', 'isStart'], false],
            7.5,
            ['boolean', ['get', 'isEnd'], false],
            7.5,
            4.5,
          ],
          'circle-color': [
            'case',
            ['boolean', ['get', 'isStart'], false],
            '#10b981', // emerald for start
            ['boolean', ['get', 'isEnd'], false],
            '#f43f5e', // rose for end
            trailDef.hex,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.92,
        },
      });
    }

    // 3. Traveler Point (Animated Blue Dot with pulse ring)
    const travelerCoords = [pts[0].lng, pts[0].lat];
    const travelerGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: travelerCoords,
          },
        },
      ],
    };

    if (map.getSource('traveler-source')) {
      (map.getSource('traveler-source') as maplibregl.GeoJSONSource).setData(travelerGeoJson);
    } else {
      map.addSource('traveler-source', {
        type: 'geojson',
        data: travelerGeoJson,
      });

      // Pulse ring
      map.addLayer({
        id: 'traveler-pulse',
        type: 'circle',
        source: 'traveler-source',
        paint: {
          'circle-radius': 15,
          'circle-color': trailDef.glowHex,
          'circle-opacity': 0.35,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Active traveling dot
      map.addLayer({
        id: 'traveler-core',
        type: 'circle',
        source: 'traveler-source',
        paint: {
          'circle-radius': 8,
          'circle-color': trailDef.hex,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    // Fit initial overview
    fitBoundsToRoute(map, pts);
  };

  const fitBoundsToRoute = (map: Map, pts: TrekPoint[]) => {
    if (pts.length === 0) return;
    const bounds = new LngLatBounds();
    pts.forEach((p) => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, {
      padding: { top: 90, bottom: 140, left: 60, right: 60 },
      pitch: 50,
      duration: 1500,
    });
  };

  // Re-run route layers when points change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;
    setupRouteLayers(map, points, appearanceSettings);
  }, [points]);

  // Update Traveler position & Follow Camera
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current || !travelerPosition || points.length < 2) return;

    // Update GeoJSON traveler position
    const travelerSource = map.getSource('traveler-source') as maplibregl.GeoJSONSource;
    if (travelerSource) {
      travelerSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [travelerPosition.lng, travelerPosition.lat],
            },
          },
        ],
      });
    }

    // Update Follow Camera
    if (cameraMode === 'follow') {
      const targetBearing = getFollowCameraBearing(points, travelerPosition.elevation);
      currentBearingRef.current = lerpAngle(currentBearingRef.current, targetBearing, 0.12);

      map.easeTo({
        center: [travelerPosition.lng, travelerPosition.lat],
        bearing: currentBearingRef.current,
        pitch: 62,
        duration: 0, // frame-synced
      });
    }
  }, [travelerPosition, cameraMode, points]);

  // Switch to Overview Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current || cameraMode !== 'overview') return;
    fitBoundsToRoute(map, points);
  }, [cameraMode]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-slate-950" />
    </div>
  );
};
