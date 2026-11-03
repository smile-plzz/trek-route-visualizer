import { Map } from 'maplibre-gl';
import { TrekPoint, TrekStats, CameraMode } from '../types';
import { interpolateAtDistance } from './geoUtils';

export interface VideoExportOptions {
  durationSec: number; // 10, 20, 30, 60
  resolution: '720p' | '1080p';
  cameraMode: CameraMode;
  onProgress: (percent: number, elapsedSec: number) => void;
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
 * Draws the high-resolution Telemetry HUD overlay onto the recording canvas.
 */
function drawTelemetryOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentDist: number,
  totalDist: number,
  currentElevation: number,
  stats: TrekStats,
  progress: number
) {
  ctx.save();

  // 1. Top Brand Pill (Left)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 2;
  const pillWidth = 260;
  const pillHeight = 44;
  ctx.beginPath();
  ctx.roundRect(30, 30, pillWidth, pillHeight, 14);
  ctx.fill();
  ctx.stroke();

  // Blue dot logo
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(52, 52, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Trek Route Visualizer', 72, 57);

  // 2. Bottom Telemetry Cards Banner
  const bannerWidth = Math.min(width - 60, 720);
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

  // Metrics inside Banner
  const distKm = (currentDist / 1000).toFixed(2);
  const totalKm = (totalDist / 1000).toFixed(2);

  // Column 1: Distance
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('DISTANCE', bannerX + 30, bannerY + 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText(`${distKm} / ${totalKm} km`, bannerX + 30, bannerY + 58);

  // Column 2: Elevation
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('ELEVATION', bannerX + 280, bannerY + 28);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText(`${Math.round(currentElevation)} m`, bannerX + 280, bannerY + 58);

  // Column 3: Total Gain
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('ELEVATION GAIN', bannerX + 500, bannerY + 28);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText(`+${stats.elevationGain} m`, bannerX + 500, bannerY + 58);

  // 3. Bottom Progress Bar
  const barHeight = 6;
  const barY = height - 12;
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

  const targetWidth = options.resolution === '1080p' ? 1920 : 1280;
  const targetHeight = options.resolution === '1080p' ? 1080 : 720;

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

    // Copy map WebGL canvas scaled to export canvas
    ctx.drawImage(mapCanvas, 0, 0, targetWidth, targetHeight);

    // Composite high-res Telemetry HUD
    drawTelemetryOverlay(
      ctx,
      targetWidth,
      targetHeight,
      currentDist,
      totalDist,
      curPos.elevation,
      stats,
      progress
    );

    const percent = Math.min(100, Math.round(progress * 100));
    const elapsedSec = (frame / fps);
    options.onProgress(percent, elapsedSec);
  }

  recorder.stop();
  return recordingPromise;
}

