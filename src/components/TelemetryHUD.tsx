import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Navigation,
  Mountain,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-2 max-w-4xl w-full">
      {/* File Parsing / Status Banner */}
      {sourceType === 'photos' && stats.totalFilesCount > 0 && (
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl text-xs shadow-lg">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              <strong className="text-white font-bold">{stats.pointsCount}</strong> of{' '}
              <strong className="text-white font-bold">{stats.totalFilesCount}</strong> photos in route
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
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-2xl bg-slate-950/70 border border-sky-500/30 backdrop-blur-xl text-xs shadow-lg">
          <div className="flex items-center gap-2 text-sky-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Both GPX and photos detected: <strong>GPX prioritized</strong> as route track</span>
          </div>
          <span className="text-slate-400 text-[11px]">Photos bypassed per spec</span>
        </div>
      )}

      {/* Main Apple-style Telemetry Card */}
      <div className="relative bg-slate-950/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-3 shadow-2xl transition-all">
        {/* Header row with collapse toggle */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Trek Telemetry
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title={isCollapsed ? 'Expand Telemetry Cards' : 'Collapse for Clean View'}
          >
            <span>{isCollapsed ? 'Show Details' : 'Minimize'}</span>
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {isCollapsed ? (
          /* Minimized Compact Strip */
          <div className="flex items-center justify-around py-1 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans mr-1.5">Dist</span>
              <span className="text-white font-bold">{formatDistance(stats.totalDistance)}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans mr-1.5">Gain</span>
              <span className="text-emerald-400 font-bold">+{stats.elevationGain} m</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans mr-1.5">Peak</span>
              <span className="text-sky-400 font-bold">{stats.highestElevation} m</span>
            </div>
          </div>
        ) : (
          /* Full 6-Metric Apple Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Total Distance */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Distance
                </span>
                <span className="block text-sm font-bold text-white truncate font-mono">
                  {formatDistance(stats.totalDistance)}
                </span>
              </div>
            </div>

            {/* Elevation Gain */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gain (+4m)
                </span>
                <span className="block text-sm font-bold text-emerald-400 truncate font-mono">
                  +{stats.elevationGain} m
                </span>
              </div>
            </div>

            {/* Elevation Loss */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Loss (-4m)
                </span>
                <span className="block text-sm font-bold text-rose-400 truncate font-mono">
                  -{stats.elevationLoss} m
                </span>
              </div>
            </div>

            {/* Highest Point */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Mountain className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Peak / Min
                </span>
                <span className="block text-sm font-bold text-white truncate font-mono">
                  {stats.highestElevation} / {stats.lowestElevation}m
                </span>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Trail Time
                </span>
                <span className="block text-sm font-bold text-white truncate font-mono">
                  {formatDuration(stats.durationMs)}
                </span>
              </div>
            </div>

            {/* Points / Photo Count */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Points
                </span>
                <span className="block text-sm font-bold text-white truncate font-mono">
                  {stats.pointsCount} pts
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
