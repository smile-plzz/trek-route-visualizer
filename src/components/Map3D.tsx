import React, { useEffect, useRef } from 'react';
import maplibregl, { Map, LngLatBounds } from 'maplibre-gl';
import { TrekPoint, CameraMode, BasemapStyle } from '../types';
import { getFollowCameraBearing, lerpAngle } from '../services/geoUtils';

interface Map3DProps {
  points: TrekPoint[];
  travelerPosition: { lat: number; lng: number; elevation: number } | null;
  cameraMode: CameraMode;
  basemapStyle: BasemapStyle;
  terrainExaggeration: number;
  onMapLoaded?: (mapInstance: Map) => void;
}

const TILE_SOURCES = {
  standard: {
    tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxzoom: 19,
  },
  satellite: {
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxzoom: 19,
  },
};

export const Map3D: React.FC<Map3DProps> = ({
  points,
  travelerPosition,
  cameraMode,
  basemapStyle,
  terrainExaggeration,
  onMapLoaded,
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

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      preserveDrawingBuffer: true, // CRITICAL FOR VIDEO RECORDING
      style: {
        version: 8,
        sources: {
          'basemap-source': {
            type: 'raster',
            tiles: TILE_SOURCES[basemapStyle].tiles,
            tileSize: 256,
            attribution: TILE_SOURCES[basemapStyle].attribution,
            maxzoom: TILE_SOURCES[basemapStyle].maxzoom,
          },
          'terrarium-dem': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            encoding: 'terrarium',
            attribution: '&copy; AWS Open Data Terrain Tiles',
            maxzoom: 14,
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
          'sky-color': '#0f172a',
          'sky-horizon-blend': 0.6,
          'horizon-color': '#1e293b',
          'horizon-fog-blend': 0.7,
          'fog-color': '#334155',
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
      setupRouteLayers(map, points);
    });

    return () => {
      isMapLoadedRef.current = false;
      map.remove();
    };
  }, []);

  // Update Basemap Style
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;

    const source = map.getSource('basemap-source') as maplibregl.RasterTileSource;
    if (source && source.setTiles) {
      source.setTiles(TILE_SOURCES[basemapStyle].tiles);
    }
  }, [basemapStyle]);

  // Update Terrain Exaggeration
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoadedRef.current) return;
    map.setTerrain({
      source: 'terrarium-dem',
      exaggeration: terrainExaggeration,
    });
  }, [terrainExaggeration]);

  // Helper to configure Route, Waypoints, and Traveler on the map
  const setupRouteLayers = (map: Map, pts: TrekPoint[]) => {
    if (pts.length < 2) return;

    const coordinates = pts.map((p) => [p.lng, p.lat]);

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
          'line-color': '#38bdf8',
          'line-width': 9,
          'line-opacity': 0.45,
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
          'line-color': '#0284c7',
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });
    }

    // 2. Waypoint Dots (Small Blue Dots at every coordinate)
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
            7,
            ['boolean', ['get', 'isEnd'], false],
            7,
            4.5,
          ],
          'circle-color': [
            'case',
            ['boolean', ['get', 'isStart'], false],
            '#10b981', // emerald for start
            ['boolean', ['get', 'isEnd'], false],
            '#f43f5e', // rose for end
            '#0ea5e9', // vivid sky blue for route dots
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
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
          'circle-radius': 14,
          'circle-color': '#38bdf8',
          'circle-opacity': 0.35,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#bae6fd',
        },
      });

      // Active traveling dot
      map.addLayer({
        id: 'traveler-core',
        type: 'circle',
        source: 'traveler-source',
        paint: {
          'circle-radius': 8,
          'circle-color': '#0284c7',
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
    setupRouteLayers(map, points);
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
      // Find distance of traveler along points
      const targetBearing = getFollowCameraBearing(points, travelerPosition.elevation);
      // Smooth bearing rotation
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
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-slate-900" />
    </div>
  );
};

