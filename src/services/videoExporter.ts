import { Map } from 'maplibre-gl';
import { TrekPoint, TrekStats, CameraMode } from '../types';
import { interpolateAtDistance } from './geoUtils';

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export interface VideoExportOptions {
  durationSec: number; // 10, 20, 30, 60
  resolution: '720p' | '1080p';
  aspectRatio: VideoAspectRatio;
  cameraMode: CameraMode;
  onProgress: (percent: number, elapsedSec: number) => void;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

/**
 * Returns exact canvas pixel width and height for a given aspect ratio and resolution.
 */
export function getExportDimensions(
  aspectRatio: VideoAspectRatio,
  resolution: '720p' | '1080p'
): CanvasDimensions {
  const is1080p = resolution === '1080p';

  switch (aspectRatio) {
    case '9:16':
      // Vertical / Portrait (Reels, TikTok, Shorts)
      return {
        width: is1080p ? 1080 : 720,
        height: is1080p ? 1920 : 1280,
      };
    case '1:1':
      // Square (Instagram Feed)
      return {
        width: is1080p ? 1080 : 720,
        height: is1080p ? 1080 : 720,
      };
    case '16:9':
    default:
      // Landscape (Desktop, YouTube)
      return {
        width: is1080p ? 1920 : 1280,
        height: is1080p ? 1080 : 720,
      };
  }
}

export function getSupportedMimeType(): { mimeType: string; extension: string } {
  const candidates = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }

  return { mimeType: 'video/webm', extension: 'webm' };
}

/**
 * Draws the high-resolution Telemetry HUD overlay onto the recording canvas,
 * adapting cleanly between Landscape (16:9), Portrait (9:16), and Square (1:1).
 */
export function drawTelemetryOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentDist: number,
  totalDist: number,
  currentElevation: number,
  stats: TrekStats,
  progress: number,
  aspectRatio: VideoAspectRatio
) {
  ctx.save();

  const isPortrait = aspectRatio === '9:16';
  const isSquare = aspectRatio === '1:1';

  // 1. Top Brand Pill
  const pillPadding = isPortrait ? 40 : 30;
  const pillWidth = isPortrait ? 320 : 260;
  const pillHeight = isPortrait ? 52 : 44;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pillPadding, pillPadding, pillWidth, pillHeight, isPortrait ? 18 : 14);
  ctx.fill();
  ctx.stroke();

  // Blue dot logo
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(pillPadding + (isPortrait ? 26 : 22), pillPadding + pillHeight / 2, isPortrait ? 10 : 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${isPortrait ? 20 : 16}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('Trek Route Visualizer', pillPadding + (isPortrait ? 48 : 42), pillPadding + pillHeight / 2 + (isPortrait ? 7 : 5));

  // 2. Metrics Overlay Banner (Layout adapts to aspect ratio)
  const distKm = (currentDist / 1000).toFixed(2);
  const totalKm = (totalDist / 1000).toFixed(2);

  if (isPortrait) {
    // 9:16 Portrait: Stacked 2x2 cards near bottom for mobile screens
    const cardWidth = width - 80;
    const cardHeight = 150;
    const cardX = 40;
    const cardY = height - cardHeight - 70;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 24);
    ctx.fill();
    ctx.stroke();

    // Row 1: Distance (Left) & Elevation (Right)
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('DISTANCE', cardX + 30, cardY + 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillText(`${distKm} / ${totalKm} km`, cardX + 30, cardY + 74);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ELEVATION', cardX + cardWidth / 2 + 20, cardY + 38);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(currentElevation)} m`, cardX + cardWidth / 2 + 20, cardY + 74);

    // Row 2: Elevation Gain
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ELEVATION GAIN', cardX + 30, cardY + 115);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText(`+${stats.elevationGain} m`, cardX + 180, cardY + 116);

  } else {
    // 16:9 Landscape or 1:1 Square: Horizontal 3-column banner
    const bannerWidth = isSquare ? width - 80 : Math.min(width - 60, 720);
    const bannerHeight = 84;
    const bannerX = (width - bannerWidth) / 2;
    const bannerY = height - bannerHeight - 35;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 18);
    ctx.fill();
    ctx.stroke();

    const colStep = bannerWidth / 3;

    // Col 1: Distance
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('DISTANCE', bannerX + 24, bannerY + 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(`${distKm} / ${totalKm} km`, bannerX + 24, bannerY + 58);

    // Col 2: Elevation
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('ELEVATION', bannerX + colStep + 10, bannerY + 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(currentElevation)} m`, bannerX + colStep + 10, bannerY + 58);

    // Col 3: Gain
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('ELEVATION GAIN', bannerX + colStep * 2 + 10, bannerY + 28);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(`+${stats.elevationGain} m`, bannerX + colStep * 2 + 10, bannerY + 58);
  }

  // 3. Bottom Progress Bar
  const barHeight = isPortrait ? 10 : 6;
  const barY = height - (isPortrait ? 18 : 12);
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(0, barY, width, barHeight);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, barY, width * progress, barHeight);

  ctx.restore();
}

/**
 * Executes high-fidelity canvas recording of the animated trek.
 */
export async function recordTrekVideo(
  map: Map,
  points: TrekPoint[],
  stats: TrekStats,
  options: VideoExportOptions,
  setScrubDistance: (dist: number) => void
): Promise<Blob> {
  const mapCanvas = map.getCanvas();
  const totalDist = points[points.length - 1]?.distance || 1;

  const { width: targetWidth, height: targetHeight } = getExportDimensions(
    options.aspectRatio,
    options.resolution
  );

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = targetWidth;
  exportCanvas.height = targetHeight;
  const ctx = exportCanvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Could not create 2D canvas context for export');
  }

  const { mimeType } = getSupportedMimeType();
  const stream = exportCanvas.captureStream(30); // 30 FPS recording stream
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.resolution === '1080p' ? 8_000_000 : 4_000_000,
  });

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  const fps = 30;
  const totalFrames = options.durationSec * fps;
  const frameIntervalMs = 1000 / fps;

  // Render Loop
  for (let frame = 0; frame <= totalFrames; frame++) {
    const progress = frame / totalFrames;
    const currentDist = progress * totalDist;
    const curPos = interpolateAtDistance(points, currentDist);

    // Update map scrubber & traveler
    setScrubDistance(currentDist);

    // Wait a brief tick for MapLibre to update and flush WebGL buffer
    await new Promise((r) => setTimeout(r, Math.max(16, frameIntervalMs / 2)));

    // Calculate center-crop mapping from map canvas to export canvas
    const mapW = mapCanvas.width;
    const mapH = mapCanvas.height;
    const scale = Math.max(targetWidth / mapW, targetHeight / mapH);
    const srcW = targetWidth / scale;
    const srcH = targetHeight / scale;
    const srcX = (mapW - srcW) / 2;
    const srcY = (mapH - srcH) / 2;

    // Draw center-cropped map frame
    ctx.drawImage(mapCanvas, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

    // Composite high-res Telemetry HUD
    drawTelemetryOverlay(
      ctx,
      targetWidth,
      targetHeight,
      currentDist,
      totalDist,
      curPos.elevation,
      stats,
      progress,
      options.aspectRatio
    );

    const percent = Math.min(100, Math.round(progress * 100));
    const elapsedSec = frame / fps;
    options.onProgress(percent, elapsedSec);
  }

  recorder.stop();
  return recordingPromise;
}
