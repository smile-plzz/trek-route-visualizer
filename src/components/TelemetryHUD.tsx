import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Navigation,
  Mountain,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { TrekStats } from '../types';

interface TelemetryHUDProps {
  stats: TrekStats;
  sourceType: 'photos' | 'gpx' | 'mixed' | 'sample';
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return '--';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ stats, sourceType }) => {
  return (
    <div className="flex flex-col gap-2.5 max-w-4xl w-full">
      {/* File Parsing Summary Banner */}
      {sourceType === 'photos' && stats.totalFilesCount > 0 && (
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md text-xs shadow-lg">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              <strong className="text-white font-bold">{stats.pointsCount}</strong> of{' '}
              <strong className="text-white font-bold">{stats.totalFilesCount}</strong> photos had GPS
            </span>
          </div>
          {stats.skippedFilesCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{stats.skippedFilesCount} skipped (no GPS metadata)</span>
            </div>
          )}
        </div>
      )}

      {sourceType === 'mixed' && (
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/30 backdrop-blur-md text-xs shadow-lg">
          <div className="flex items-center gap-2 text-sky-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Both GPX and photos detected: <strong>GPX track prioritized</strong> as route source</span>
          </div>
          <span className="text-slate-400 text-[11px]">Photos bypassed per MVP rule</span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        {/* Total Distance */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Distance
            </span>
            <span className="block text-sm font-black text-white truncate font-mono">
              {formatDistance(stats.totalDistance)}
            </span>
          </div>
        </div>

        {/* Elevation Gain */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Gain (+4m)
            </span>
            <span className="block text-sm font-black text-emerald-400 truncate font-mono">
              +{stats.elevationGain} m
            </span>
          </div>
        </div>

        {/* Elevation Loss */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Loss (-4m)
            </span>
            <span className="block text-sm font-black text-rose-400 truncate font-mono">
              -{stats.elevationLoss} m
            </span>
          </div>
        </div>

        {/* Elevation Range (Peak / Low) */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Mountain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Elevation
            </span>
            <span className="block text-xs font-bold text-white truncate font-mono">
              {stats.lowestElevation}m – {stats.highestElevation}m
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Duration
            </span>
            <span className="block text-sm font-black text-white truncate font-mono">
              {formatDuration(stats.durationMs)}
            </span>
          </div>
        </div>

        {/* Waypoints Count */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Waypoints
            </span>
            <span className="block text-sm font-black text-white truncate font-mono">
              {stats.pointsCount} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

