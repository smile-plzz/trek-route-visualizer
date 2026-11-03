import React, { useState } from 'react';
import {
  X,
  Video,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Smartphone,
  Monitor,
  Square,
  Sliders,
  Sparkles,
  Gauge,
  Activity,
  Layers,
} from 'lucide-react';
import { CameraMode, TrekPoint, TrekStats } from '../types';
import {
  recordTrekVideo,
  getSupportedMimeType,
  VideoAspectRatio,
  getExportDimensions,
} from '../services/videoExporter';
import { Map } from 'maplibre-gl';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  map: Map | null;
  points: TrekPoint[];
  stats: TrekStats;
  currentCameraMode: CameraMode;
  onScrubDistance: (dist: number) => void;
}

const DURATION_PRESETS = [
  { label: '15s', sec: 15, hint: 'Quick' },
  { label: '30s', sec: 30, hint: 'Social' },
  { label: '60s', sec: 60, hint: 'Standard' },
  { label: '90s', sec: 90, hint: 'Relaxed' },
  { label: '120s', sec: 120, hint: 'Slow Pan' },
  { label: '180s', sec: 180, hint: 'Cinematic' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  map,
  points,
  stats,
  currentCameraMode,
  onScrubDistance,
}) => {
  const [durationSec, setDurationSec] = useState<number>(30);
  const [fps, setFps] = useState<30 | 60>(30);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [cameraMode, setCameraMode] = useState<CameraMode>(currentCameraMode);

  // Overlay layer toggles
  const [showTelemetryHud, setShowTelemetryHud] = useState<boolean>(true);
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [showProgressBar, setShowProgressBar] = useState<boolean>(true);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadExt, setDownloadExt] = useState<string>('webm');

  if (!isOpen) return null;

  const targetDims = getExportDimensions(aspectRatio, resolution);

  const handleStartExport = async () => {
    if (!map || points.length < 2) return;
    setIsRecording(true);
    setProgressPercent(0);
    setDownloadUrl(null);

    try {
      const { extension } = getSupportedMimeType();
      setDownloadExt(extension);

      const videoBlob = await recordTrekVideo(
        map,
        points,
        stats,
        {
          durationSec,
          fps,
          resolution,
          aspectRatio,
          cameraMode,
          showTelemetryHud,
          showElevationProfile,
          showWatermark,
          showProgressBar,
          onProgress: (pct) => setProgressPercent(pct),
        },
        onScrubDistance
      );

      const url = URL.createObjectURL(videoBlob);
      setDownloadUrl(url);

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `trek_route_${aspectRatio.replace(':', 'x')}_${durationSec}s_${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Video export encountered an error. Please try again with 720p or a shorter duration.');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        {!isRecording && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Export 3D Route Video</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Render and record your trek animation completely in your browser.
            </p>
          </div>
        </div>

        {/* Recording Active View */}
        {isRecording ? (
          <div className="py-10 text-center space-y-5">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <Loader2 className="w-24 h-24 text-sky-500 animate-spin opacity-40 absolute inset-0" />
              <span className="text-2xl font-black font-mono text-white">
                {progressPercent}%
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Recording 3D Flight Path...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Rendering {targetDims.width}×{targetDims.height} @ {fps} FPS ({durationSec}s).
                <br />
                <strong>Please keep this browser tab visible</strong> while WebGL frames are being captured.
              </p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden max-w-md mx-auto">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-500 h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : downloadUrl ? (
          /* Finished State */
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Video Ready & Downloaded!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your high-resolution {aspectRatio} ({downloadExt.toUpperCase()}) video was saved.
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <a
                href={downloadUrl}
                download={`trek_route_${aspectRatio.replace(':', 'x')}_${durationSec}s.${downloadExt}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download Again
              </a>
              <button
                onClick={() => setDownloadUrl(null)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-all"
              >
                Change Settings
              </button>
            </div>
          </div>
        ) : (
          /* Settings Form */
          <div className="space-y-5">
            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Aspect Ratio / Social Format
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    aspectRatio === '16:9'
                      ? 'bg-sky-500/15 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Monitor className="w-5 h-5 mx-auto mb-1.5" />
                  <div className="text-xs font-bold">16:9 Landscape</div>
                  <div className="text-[10px] text-slate-500">YouTube / Web</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    aspectRatio === '9:16'
                      ? 'bg-sky-500/15 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1.5" />
                  <div className="text-xs font-bold">9:16 Vertical</div>
                  <div className="text-[10px] text-slate-500">Shorts / Reels</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    aspectRatio === '1:1'
                      ? 'bg-sky-500/15 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Square className="w-5 h-5 mx-auto mb-1.5" />
                  <div className="text-xs font-bold">1:1 Square</div>
                  <div className="text-[10px] text-slate-500">Instagram Feed</div>
                </button>
              </div>
            </div>

            {/* Duration Slider & Direct Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Video Duration
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationSec}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setDurationSec(Math.max(5, Math.min(180, val)));
                    }}
                    className="w-16 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold text-sky-400 focus:outline-none focus:border-sky-400"
                  />
                  <span className="text-xs text-slate-400">sec</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={5}
                max={180}
                step={1}
                value={durationSec}
                onChange={(e) => setDurationSec(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 transition-all mb-2.5"
              />

              {/* Quick Preset Pills */}
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((p) => (
                  <button
                    key={p.sec}
                    type="button"
                    onClick={() => setDurationSec(p.sec)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      durationSec === p.sec
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p.label} <span className="opacity-60 font-normal">({p.hint})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & FPS Controls */}
            <div className="grid grid-cols-2 gap-3">
              {/* Resolution */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Resolution
                </label>
                <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      resolution === '1080p'
                        ? 'bg-sky-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1080p Full HD
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      resolution === '720p'
                        ? 'bg-sky-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    720p Fast
                  </button>
                </div>
              </div>

              {/* Frame Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Frame Rate
                </label>
                <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setFps(30)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      fps === 30
                        ? 'bg-sky-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    30 FPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setFps(60)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      fps === 60
                        ? 'bg-sky-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    60 FPS Smooth
                  </button>
                </div>
              </div>
            </div>

            {/* Overlay Layers Toggles */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                HUD Overlays on Video
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Telemetry */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer hover:bg-slate-900">
                  <span className="text-slate-300">Live Telemetry Metrics</span>
                  <input
                    type="checkbox"
                    checked={showTelemetryHud}
                    onChange={(e) => setShowTelemetryHud(e.target.checked)}
                    className="accent-sky-400 rounded cursor-pointer"
                  />
                </label>

                {/* Profile Sparkline */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer hover:bg-slate-900">
                  <span className="text-slate-300">Elevation Profile Sparkline</span>
                  <input
                    type="checkbox"
                    checked={showElevationProfile}
                    onChange={(e) => setShowElevationProfile(e.target.checked)}
                    className="accent-sky-400 rounded cursor-pointer"
                  />
                </label>

                {/* Watermark */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer hover:bg-slate-900">
                  <span className="text-slate-300">App Brand Pill</span>
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="accent-sky-400 rounded cursor-pointer"
                  />
                </label>

                {/* Progress bar */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer hover:bg-slate-900">
                  <span className="text-slate-300">Bottom Progress Bar</span>
                  <input
                    type="checkbox"
                    checked={showProgressBar}
                    onChange={(e) => setShowProgressBar(e.target.checked)}
                    className="accent-sky-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Export Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartExport}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-sky-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4 text-slate-950" />
                Render & Export Video ({targetDims.width}×{targetDims.height} @ {fps}fps)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
