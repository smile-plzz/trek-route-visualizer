import { Map } from 'maplibre-gl';
import { TrekPoint, TrekStats, CameraMode } from '../types';
import { interpolateAtDistance } from './geoUtils';

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export interface VideoExportOptions {
  durationSec: number; // 5 to 180 seconds
  fps: 30 | 60;
  resolution: '720p' | '1080p';
  aspectRatio: VideoAspectRatio;
  cameraMode: CameraMode;
  showTelemetryHud?: boolean;
  showElevationProfile?: boolean;
  showWatermark?: boolean;
  showProgressBar?: boolean;
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
  aspectRatio: VideoAspectRatio,
  points?: TrekPoint[],
  layerOptions?: {
    showTelemetryHud?: boolean;
    showElevationProfile?: boolean;
    showWatermark?: boolean;
    showProgressBar?: boolean;
  }
) {
  ctx.save();

  const isPortrait = aspectRatio === '9:16';
  const isSquare = aspectRatio === '1:1';
  const showTelemetry = layerOptions?.showTelemetryHud !== false;
  const showWatermark = layerOptions?.showWatermark !== false;
  const showProgress = layerOptions?.showProgressBar !== false;
  const showProfile = layerOptions?.showElevationProfile !== false;

  // 1. Top Brand Pill (Apple Minimalist style)
  if (showWatermark) {
    const pillPadding = isPortrait ? 40 : 30;
    const pillWidth = isPortrait ? 310 : 250;
    const pillHeight = isPortrait ? 50 : 42;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillPadding, pillPadding, pillWidth, pillHeight, isPortrait ? 18 : 14);
    ctx.fill();
    ctx.stroke();

    // Cyan accent dot
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(
      pillPadding + (isPortrait ? 24 : 20),
      pillPadding + pillHeight / 2,
      isPortrait ? 8 : 7,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isPortrait ? 18 : 15}px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
    ctx.fillText(
      'Trek Route Visualizer',
      pillPadding + (isPortrait ? 44 : 38),
      pillPadding + pillHeight / 2 + (isPortrait ? 6 : 5)
    );
  }

  // 2. Metrics Overlay Banner (Layout adapts to aspect ratio)
  const distKm = (currentDist / 1000).toFixed(2);
  const totalKm = (totalDist / 1000).toFixed(2);

  if (showTelemetry) {
    if (isPortrait) {
      // 9:16 Portrait: Stacked 2x2 cards near bottom for mobile screens
      const cardWidth = width - 80;
      const cardHeight = 150;
      const cardX = 40;
      const cardY = height - cardHeight - 70;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 24);
      ctx.fill();
      ctx.stroke();

      // Row 1: Distance (Left) & Elevation (Right)
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.fillText('DISTANCE', cardX + 30, cardY + 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillText(`${distKm} / ${totalKm} km`, cardX + 30, cardY + 74);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.fillText('ELEVATION', cardX + cardWidth / 2 + 20, cardY + 38);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.round(currentElevation)} m`, cardX + cardWidth / 2 + 20, cardY + 74);

      // Row 2: Elevation Gain
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.fillText('ELEVATION GAIN', cardX + 30, cardY + 115);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 26px "JetBrains Mono", monospace';
      ctx.fillText(`+${stats.elevationGain} m`, cardX + 180, cardY + 116);
    } else {
      // 16:9 Landscape or 1:1 Square: Horizontal 3-column banner
      const bannerWidth = isSquare ? width - 80 : Math.min(width - 60, 720);
      const bannerHeight = 84;
      const bannerX = (width - bannerWidth) / 2;
      const bannerY = height - bannerHeight - 35;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerWidth, bannerHeight, 20);
      ctx.fill();
      ctx.stroke();

      const colStep = bannerWidth / 3;

      // Col 1: Distance
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillText('DISTANCE', bannerX + 24, bannerY + 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(`${distKm} / ${totalKm} km`, bannerX + 24, bannerY + 58);

      // Col 2: Elevation
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillText('ELEVATION', bannerX + colStep + 10, bannerY + 28);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.round(currentElevation)} m`, bannerX + colStep + 10, bannerY + 58);

      // Col 3: Gain
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.fillText('ELEVATION GAIN', bannerX + colStep * 2 + 10, bannerY + 28);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(`+${stats.elevationGain} m`, bannerX + colStep * 2 + 10, bannerY + 58);
    }
  }

  // 3. Mini Elevation Profile Sparkline (Optional overlay on video)
  if (showProfile && points && points.length > 2) {
    const profWidth = isPortrait ? 280 : 220;
    const profHeight = isPortrait ? 52 : 42;
    const profX = width - profWidth - (isPortrait ? 40 : 30);
    const profY = isPortrait ? 40 : 30;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(profX, profY, profWidth, profHeight, 14);
    ctx.fill();
    ctx.stroke();

    // Draw sparkline
    const pad = 8;
    const innerW = profWidth - pad * 2;
    const innerH = profHeight - pad * 2;
    const minEle = stats.lowestElevation || 0;
    const maxEle = Math.max(stats.highestElevation, minEle + 10);
    const eleRange = maxEle - minEle || 1;

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = profX + pad + (points[i].distance / (totalDist || 1)) * innerW;
      const py = profY + profHeight - pad - ((points[i].elevation - minEle) / eleRange) * innerH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw active cursor dot
    const curX = profX + pad + progress * innerW;
    const curY = profY + profHeight - pad - ((currentElevation - minEle) / eleRange) * innerH;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Bottom Progress Bar
  if (showProgress) {
    const barHeight = isPortrait ? 8 : 5;
    const barY = height - (isPortrait ? 16 : 10);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, barY, width, barHeight);

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(0, barY, width * progress, barHeight);
  }

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

  const fps = options.fps || 30;
  const { mimeType } = getSupportedMimeType();
  const stream = exportCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.resolution === '1080p' ? 9_000_000 : 4_500_000,
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

  const totalFrames = Math.max(1, Math.round(options.durationSec * fps));
  const frameIntervalMs = 1000 / fps;

  // Render Loop
  for (let frame = 0; frame <= totalFrames; frame++) {
    const progress = frame / totalFrames;
    const currentDist = progress * totalDist;
    const curPos = interpolateAtDistance(points, currentDist);

    // Update map scrubber & traveler
    setScrubDistance(currentDist);

    // Wait for MapLibre to update and flush WebGL buffer
    await new Promise((r) => setTimeout(r, Math.max(14, frameIntervalMs / 2)));

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
      options.aspectRatio,
      points,
      {
        showTelemetryHud: options.showTelemetryHud,
        showElevationProfile: options.showElevationProfile,
        showWatermark: options.showWatermark,
        showProgressBar: options.showProgressBar,
      }
    );

    const percent = Math.min(100, Math.round(progress * 100));
    const elapsedSec = frame / fps;
    options.onProgress(percent, elapsedSec);
  }

  recorder.stop();
  return recordingPromise;
}
