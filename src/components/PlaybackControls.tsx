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
} from 'lucide-react';
import { CameraMode, BasemapStyle } from '../types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  progress: number; // 0..1
  durationSec: number;
  cameraMode: CameraMode;
  basemapStyle: BasemapStyle;
  terrainExaggeration: number;
  onTogglePlay: () => void;
  onScrubProgress: (progress: number) => void;
  onDurationChange: (sec: number) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  onBasemapStyleChange: (style: BasemapStyle) => void;
  onExaggerationChange: (val: number) => void;
  onOpenExport: () => void;
  onReset: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  progress,
  durationSec,
  cameraMode,
  basemapStyle,
  terrainExaggeration,
  onTogglePlay,
  onScrubProgress,
  onDurationChange,
  onCameraModeChange,
  onBasemapStyleChange,
  onExaggerationChange,
  onOpenExport,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-3 max-w-4xl w-full bg-slate-950/85 p-3.5 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
      {/* Top Scrubber & Main Playback Row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          className="w-11 h-11 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Timeline Slider */}
        <div className="flex-1 flex flex-col justify-center">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => onScrubProgress(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 transition-all"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
            <span>{(progress * durationSec).toFixed(1)}s</span>
            <span>{Math.round(progress * 100)}%</span>
            <span>{durationSec}s</span>
          </div>
        </div>

        {/* Export Video Button */}
        <button
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex-shrink-0"
        >
          <Video className="w-4 h-4" />
          <span>Export Video</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset & Load New Trek"
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all active:scale-95 flex-shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Control Bar: Durations, Camera, Basemap, Terrain */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
        {/* Playback Length (10s, 20s, 30s, 60s) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Duration:
          </span>
          {[10, 20, 30, 60].map((sec) => (
            <button
              key={sec}
              onClick={() => onDurationChange(sec)}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                durationSec === sec
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Camera Mode (Follow vs Overview) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Camera:
          </span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => onCameraModeChange('follow')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                cameraMode === 'follow'
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Follow</span>
            </button>
            <button
              onClick={() => onCameraModeChange('overview')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                cameraMode === 'overview'
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
          </div>
        </div>

        {/* Basemap Switcher (Standard vs Satellite) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Style:
          </span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => onBasemapStyleChange('standard')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                basemapStyle === 'standard'
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>
            <button
              onClick={() => onBasemapStyleChange('satellite')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                basemapStyle === 'satellite'
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
          </div>
        </div>

        {/* Terrain Exaggeration Slider (1.0x to 2.5x) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>3D Relief:</span>
          </span>
          <input
            type="range"
            min={1.0}
            max={2.5}
            step={0.1}
            value={terrainExaggeration}
            onChange={(e) => onExaggerationChange(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <span className="text-[11px] font-mono text-white font-bold w-7">
            {terrainExaggeration.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
};
