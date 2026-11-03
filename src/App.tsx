import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Map } from 'maplibre-gl';
import { RouteProcessingResult, CameraMode, BasemapStyle } from './types';
import { SAMPLE_TREK_POINTS } from './data/sampleTrek';
import { parsePhotoFiles } from './services/exifParser';
import { parseGpxString } from './services/gpxParser';
import { processRoutePoints } from './services/routeProcessor';
import { interpolateAtDistance } from './services/geoUtils';

import { DropZone } from './components/DropZone';
import { Map3D } from './components/Map3D';
import { TelemetryHUD } from './components/TelemetryHUD';
import { ElevationChart } from './components/ElevationChart';
import { PlaybackControls } from './components/PlaybackControls';
import { ExportModal } from './components/ExportModal';
import { PrivacyTrimModal } from './components/PrivacyTrimModal';
import { applyPrivacyTrim } from './services/privacyTrim';
import { downloadGpx } from './services/gpxExporter';

export const App: React.FC = () => {
  const [routeData, setRouteData] = useState<RouteProcessingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0..1
  const [playbackDurationSec, setPlaybackDurationSec] = useState<number>(20);
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>('satellite');
  const [terrainExaggeration, setTerrainExaggeration] = useState<number>(1.5);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [startTrimMeters, setStartTrimMeters] = useState<number>(0);
  const [endTrimMeters, setEndTrimMeters] = useState<number>(0);

  const mapInstanceRef = useRef<Map | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Active Route (with Privacy Trim applied)
  const activeRoute = useMemo(() => {
    if (!routeData) return null;
    if (startTrimMeters === 0 && endTrimMeters === 0) {
      return {
        points: routeData.points,
        stats: routeData.stats,
        sourceType: routeData.sourceType,
      };
    }
    const { trimmedPoints, stats } = applyPrivacyTrim(
      routeData.points,
      routeData.stats,
      startTrimMeters,
      endTrimMeters
    );
    return {
      points: trimmedPoints,
      stats,
      sourceType: routeData.sourceType,
    };
  }, [routeData, startTrimMeters, endTrimMeters]);

  // Computed Current Position & Traveler State
  const travelerPosition = useMemo(() => {
    if (!activeRoute || activeRoute.points.length === 0) return null;
    const totalDist = activeRoute.points[activeRoute.points.length - 1].distance || 1;
    const currentDist = progress * totalDist;
    return interpolateAtDistance(activeRoute.points, currentDist);
  }, [activeRoute, progress]);

  const currentDistance = useMemo(() => {
    if (!activeRoute || activeRoute.points.length === 0) return 0;
    const totalDist = activeRoute.points[activeRoute.points.length - 1].distance || 0;
    return progress * totalDist;
  }, [activeRoute, progress]);

  // Animation Loop (Distance-constant velocity)
  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (time: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }
      const deltaSec = (time - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = time;

      setProgress((prev) => {
        const next = prev + deltaSec / playbackDurationSec;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackDurationSec]);

  // Load Built-in Sample Route
  const handleLoadSample = useCallback(async () => {
    setIsLoading(true);
    setProgressText('Loading Matterhorn Alpine sample trek...');
    setProgressPercent(40);

    try {
      const result = await processRoutePoints(SAMPLE_TREK_POINTS, 'sample');
      setRouteData(result);
      setProgress(0);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to load sample trek:', err);
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  }, []);

  // Process User Files (Photos and/or GPX)
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    setProgressPercent(10);
    setProgressText('Inspecting files...');

    try {
      const gpxFiles = files.filter((f) => f.name.toLowerCase().endsWith('.gpx'));
      const photoFiles = files.filter((f) => {
        const ext = f.name.toLowerCase();
        return (
          ext.endsWith('.jpg') ||
          ext.endsWith('.jpeg') ||
          ext.endsWith('.heic') ||
          ext.endsWith('.heif')
        );
      });

      // Spec rule: If GPX is supplied, it acts as the primary route track
      if (gpxFiles.length > 0) {
        const isMixed = photoFiles.length > 0;
        setProgressText(`Parsing GPX file: ${gpxFiles[0].name}${isMixed ? ' (GPX takes priority over photos)' : ''}...`);
        const gpxText = await gpxFiles[0].text();
        const rawPoints = parseGpxString(gpxText, gpxFiles[0].name);

        if (rawPoints.length < 2) {
          alert('GPX file did not contain at least 2 valid coordinates.');
          setIsLoading(false);
          return;
        }

        setProgressText('Enriching route with AWS Terrarium 3D elevation...');
        const result = await processRoutePoints(rawPoints, isMixed ? 'mixed' : 'gpx');
        setRouteData(result);
        setProgress(0);
        setIsPlaying(true);
      } else if (photoFiles.length > 0) {
        setProgressText(`Reading EXIF metadata from ${photoFiles.length} photos...`);
        const { validPoints, skippedCount, totalCount } = await parsePhotoFiles(
          photoFiles,
          (processed, total) => {
            const pct = Math.round((processed / total) * 70) + 10;
            setProgressPercent(pct);
            setProgressText(`Reading headers: ${processed} of ${total} files...`);
          }
        );

        if (validPoints.length < 2) {
          alert(
            `Found ${validPoints.length} geotagged photo(s). At least 2 geotagged photos are required to reconstruct a trek route.`
          );
          setIsLoading(false);
          return;
        }

        setProgressText('Enriching with 3D terrain elevation tiles...');
        setProgressPercent(85);
        const result = await processRoutePoints(
          validPoints,
          'photos',
          totalCount,
          skippedCount
        );

        setRouteData(result);
        setProgress(0);
        setIsPlaying(true);
      } else {
        alert('Please provide JPEG/HEIC photos with GPS or a GPX track file.');
      }
    } catch (err) {
      console.error('File parsing error:', err);
      alert('An error occurred while processing files. Please check file formats and try again.');
    } finally {
      setIsLoading(false);
      setProgressText('');
    }
  }, []);

  // Scrubbing Handlers
  const handleScrubProgress = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(1, newProgress)));
  }, []);

  const handleScrubDistance = useCallback(
    (dist: number) => {
      if (!activeRoute || activeRoute.points.length === 0) return;
      const totalDist = activeRoute.points[activeRoute.points.length - 1].distance || 1;
      setProgress(Math.max(0, Math.min(1, dist / totalDist)));
    },
    [activeRoute]
  );

  // Reset to initial clean state
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setRouteData(null);
    setProgress(0);
    setStartTrimMeters(0);
    setEndTrimMeters(0);
    setIsPrivacyModalOpen(false);
    setIsExportModalOpen(false);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* 3D Map View (Underlay) */}
      {activeRoute && (
        <div className="absolute inset-0 z-0">
          <Map3D
            points={activeRoute.points}
            travelerPosition={travelerPosition}
            cameraMode={cameraMode}
            basemapStyle={basemapStyle}
            terrainExaggeration={terrainExaggeration}
            onMapLoaded={(m) => {
              mapInstanceRef.current = m;
            }}
          />
        </div>
      )}

      {/* Main UI Overlay */}
      {!activeRoute ? (
        /* State 1: Drop Zone / Landing Screen */
        <div className="relative z-10 flex-1 flex items-center justify-center p-4">
          <DropZone
            onFilesSelected={handleFilesSelected}
            onLoadSample={handleLoadSample}
            isLoading={isLoading}
            progressText={progressText}
            progressPercent={progressPercent}
          />
        </div>
      ) : (
        /* State 2: Active Trek HUD & Controls Overlay */
        <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none p-4 md:p-6">
          {/* Top Row: Telemetry HUD */}
          <div className="flex flex-col items-center w-full pointer-events-auto">
            <TelemetryHUD stats={activeRoute.stats} sourceType={activeRoute.sourceType} />
          </div>

          {/* Bottom Row: Elevation Profile & Playback Controls */}
          <div className="flex flex-col items-center gap-3 w-full max-w-4xl mx-auto pointer-events-auto">
            <ElevationChart
              points={activeRoute.points}
              currentDistance={currentDistance}
              onScrubDistance={handleScrubDistance}
            />

            <PlaybackControls
              isPlaying={isPlaying}
              progress={progress}
              durationSec={playbackDurationSec}
              cameraMode={cameraMode}
              basemapStyle={basemapStyle}
              terrainExaggeration={terrainExaggeration}
              isTrimActive={startTrimMeters > 0 || endTrimMeters > 0}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onScrubProgress={handleScrubProgress}
              onDurationChange={setPlaybackDurationSec}
              onCameraModeChange={setCameraMode}
              onBasemapStyleChange={setBasemapStyle}
              onExaggerationChange={setTerrainExaggeration}
              onOpenPrivacyTrim={() => setIsPrivacyModalOpen(true)}
              onExportGpx={() => activeRoute && downloadGpx(activeRoute.points)}
              onOpenExport={() => {
                setIsPlaying(false);
                setIsExportModalOpen(true);
              }}
              onReset={handleReset}
            />
          </div>
        </div>
      )}

      {/* Privacy Trim Modal */}
      {routeData && (
        <PrivacyTrimModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
          totalDistance={routeData.points[routeData.points.length - 1]?.distance || 0}
          startTrim={startTrimMeters}
          endTrim={endTrimMeters}
          onApplyTrim={(start, end) => {
            setStartTrimMeters(start);
            setEndTrimMeters(end);
            setProgress(0);
          }}
          onResetTrim={() => {
            setStartTrimMeters(0);
            setEndTrimMeters(0);
            setProgress(0);
          }}
        />
      )}

      {/* Video Export Modal */}
      {activeRoute && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          map={mapInstanceRef.current}
          points={activeRoute.points}
          stats={activeRoute.stats}
          currentCameraMode={cameraMode}
          onScrubDistance={handleScrubDistance}
        />
      )}
    </div>
  );
};

export default App;

