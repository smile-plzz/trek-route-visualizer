import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Eye,
  Camera,
  Map as MapIcon,
  Layers,
  Sparkles,
  Shield,
  FileDown,
  Palette,
  MapPin,
  Compass,
} from 'lucide-react';
import { CameraMode, BasemapStyle } from '../types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  progress: number; // 0..1
  durationSec: number;
  cameraMode: CameraMode;
  terrainExaggeration: number;
  isTrimActive?: boolean;
  activeWaypointsCount: number;
  totalWaypointsCount: number;
  onTogglePlay: () => void;
  onScrubProgress: (progress: number) => void;
  onDurationChange: (sec: number) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  onExaggerationChange: (val: number) => void;
  onOpenAppearance: () => void;
  onOpenWaypoints: () => void;
  onOpenPrivacyTrim: () => void;
  onExportGpx: () => void;
  onOpenExport: () => void;
  onReset: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  progress,
  durationSec,
  cameraMode,
  terrainExaggeration,
  onTogglePlay,
  onScrubProgress,
  onDurationChange,
  onCameraModeChange,
  onExaggerationChange,
  isTrimActive,
  activeWaypointsCount,
  totalWaypointsCount,
  onOpenAppearance,
  onOpenWaypoints,
  onOpenPrivacyTrim,
  onExportGpx,
  onOpenExport,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-2.5 max-w-4xl w-full bg-slate-950/70 p-3 md:p-4 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-2xl text-slate-100">
      {/* Row 1: Playback Timeline & Scrubber */}
      <div className="flex items-center gap-3">
        {/* Play / Pause Circular Spring Button */}
        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause Trek' : 'Play Animated Trek'}
          className="w-11 h-11 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current text-slate-950" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5 text-slate-950" />
          )}
        </button>

        {/* Timeline Slider with Apple Glass track */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => onScrubProgress(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800/90 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 transition-all"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
            <span>{(progress * durationSec).toFixed(1)}s</span>
            <span className="font-semibold text-slate-300">{Math.round(progress * 100)}%</span>
            <span>{durationSec}s</span>
          </div>
        </div>

        {/* Video Export Hero Pill */}
        <button
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex-shrink-0"
        >
          <Video className="w-4 h-4 fill-current text-slate-950" />
          <span className="hidden sm:inline">Export Video</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Row 2: Secondary Controls Dock */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
        {/* Left Tools Group: Waypoints, Appearance, Privacy, GPX */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Waypoints & Photos Drawer Toggle */}
          <button
            onClick={onOpenWaypoints}
            title="Manage photos & waypoints"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-all active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Photos</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] font-mono text-white">
              {activeWaypointsCount}
            </span>
          </button>

          {/* 3D Appearance Modal Toggle */}
          <button
            onClick={onOpenAppearance}
            title="Map themes & lighting atmosphere"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-all active:scale-95"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Appearance</span>
          </button>

          {/* Privacy Trim Modal Toggle */}
          <button
            onClick={onOpenPrivacyTrim}
            title="Mask trailhead or campsite coordinates"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              isTrimActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                : 'bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Privacy</span>
          </button>

          {/* GPX Export */}
          <button
            onClick={onExportGpx}
            title="Export clean GPX 1.1 file"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-medium transition-all active:scale-95"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">GPX</span>
          </button>
        </div>

        {/* Right Tools Group: Camera Mode, Relief Exaggeration, Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Camera Mode Toggle */}
          <div className="flex rounded-xl bg-slate-900 border border-white/10 p-0.5">
            <button
              onClick={() => onCameraModeChange('follow')}
              title="Camera follows moving trekker point"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                cameraMode === 'follow'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              Follow
            </button>
            <button
              onClick={() => onCameraModeChange('overview')}
              title="Static bird's-eye overview of entire route"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                cameraMode === 'overview'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              Overview
            </button>
          </div>

          {/* 3D Relief Exaggeration Slider */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">3D Relief</span>
            <input
              type="range"
              min={1.0}
              max={3.0}
              step={0.1}
              value={terrainExaggeration}
              onChange={(e) => onExaggerationChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <span className="text-[10px] font-mono text-slate-300">{terrainExaggeration.toFixed(1)}x</span>
          </div>

          {/* Reset Route */}
          <button
            onClick={onReset}
            title="Clear and reset route"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
