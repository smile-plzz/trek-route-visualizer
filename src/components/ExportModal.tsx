import React, { useState } from 'react';
import { X, Video, Download, CheckCircle, AlertTriangle, Loader2, Smartphone, Monitor, Square } from 'lucide-react';
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

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  map,
  points,
  stats,
  currentCameraMode,
  onScrubDistance,
}) => {
  const [durationSec, setDurationSec] = useState<number>(20);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [cameraMode, setCameraMode] = useState<CameraMode>(currentCameraMode);
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
          resolution,
          aspectRatio,
          cameraMode,
          onProgress: (pct) => setProgressPercent(pct),
        },
        onScrubDistance
      );

      const url = URL.createObjectURL(videoBlob);
      setDownloadUrl(url);

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `trek_route_${aspectRatio.replace(':', 'x')}_${Date.now()}.${extension}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        {!isRecording && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-inner">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Export Trek Video</h3>
            <p className="text-xs text-slate-400">
              Record 3D animation with live telemetry HUD overlay
            </p>
          </div>
        </div>

        {isRecording ? (
          /* Live Recording Progress State */
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-sky-400 animate-spin mb-4" />
            <h4 className="text-lg font-bold text-white mb-1">
              Recording Animation ({progressPercent}%)
            </h4>
            <p className="text-xs text-slate-400 mb-6 text-center max-w-xs">
              Keep this browser tab visible while frames are composited and recorded.
            </p>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Rendering {aspectRatio} at {targetDims.width}×{targetDims.height} (30 FPS)
            </span>
          </div>
        ) : downloadUrl ? (
          /* Success / Download State */
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              Video Generated Successfully!
            </h4>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              Your {aspectRatio} trek animation has downloaded automatically. You can also re-download it below.
            </p>

            <div className="flex gap-3 w-full">
              <a
                href={downloadUrl}
                download={`trek_route_${aspectRatio.replace(':', 'x')}_${Date.now()}.${downloadExt}`}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Re-Download Video</span>
              </a>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Config State */
          <div className="space-y-5">
            {/* Aspect Ratio Presets (16:9, 9:16, 1:1) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                    aspectRatio === '16:9'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>16:9 Landscape</span>
                  <span className="text-[10px] opacity-75 font-mono">Desktop / YT</span>
                </button>

                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                    aspectRatio === '9:16'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>9:16 Portrait</span>
                  <span className="text-[10px] opacity-75 font-mono">Reels / Shorts</span>
                </button>

                <button
                  onClick={() => setAspectRatio('1:1')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                    aspectRatio === '1:1'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span>1:1 Square</span>
                  <span className="text-[10px] opacity-75 font-mono">Feed Post</span>
                </button>
              </div>
            </div>

            {/* Length Option */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Video Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setDurationSec(sec)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                      durationSec === sec
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Option */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Video Resolution
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResolution('1080p')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left flex justify-between items-center ${
                    resolution === '1080p'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>1080p Full HD</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {targetDims.width}×{targetDims.height}
                  </span>
                </button>
                <button
                  onClick={() => setResolution('720p')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left flex justify-between items-center ${
                    resolution === '720p'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>720p HD</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    {aspectRatio === '9:16' ? '720×1280' : aspectRatio === '1:1' ? '720×720' : '1280×720'}
                  </span>
                </button>
              </div>
            </div>

            {/* Camera Option */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Camera Angle
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCameraMode('follow')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left ${
                    cameraMode === 'follow'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>3D Follow Camera</span>
                  <span className="block text-[10px] font-normal opacity-75 mt-0.5">
                    Dynamic trail tracking & pitch
                  </span>
                </button>
                <button
                  onClick={() => setCameraMode('overview')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left ${
                    cameraMode === 'overview'
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Overview Angle</span>
                  <span className="block text-[10px] font-normal opacity-75 mt-0.5">
                    Broad birds-eye 3D relief
                  </span>
                </button>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                Recording runs directly in your browser canvas. Please keep this tab active while the video records.
              </span>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStartExport}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-sky-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>Start Recording ({durationSec}s • {aspectRatio})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
