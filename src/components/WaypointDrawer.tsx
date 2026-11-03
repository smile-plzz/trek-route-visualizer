import React, { useState, useMemo } from 'react';
import {
  X,
  Camera,
  CheckSquare,
  Square,
  Search,
  Crosshair,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { TrekPoint } from '../types';

interface WaypointDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allWaypoints: TrekPoint[];
  excludedIds: Set<string>;
  onToggleWaypoint: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  mergeDuplicates: boolean;
  onToggleMergeDuplicates: (merged: boolean) => void;
  skippedFilesCount: number;
  totalFilesCount: number;
  onFlyToPoint: (pt: TrekPoint) => void;
}

export const WaypointDrawer: React.FC<WaypointDrawerProps> = ({
  isOpen,
  onClose,
  allWaypoints,
  excludedIds,
  onToggleWaypoint,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  mergeDuplicates,
  onToggleMergeDuplicates,
  skippedFilesCount,
  totalFilesCount,
  onFlyToPoint,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredWaypoints = useMemo(() => {
    if (!searchQuery.trim()) return allWaypoints;
    const q = searchQuery.toLowerCase();
    return allWaypoints.filter(
      (wpt, idx) =>
        (wpt.name && wpt.name.toLowerCase().includes(q)) ||
        `#${idx + 1}`.includes(q) ||
        `${wpt.elevation}m`.includes(q)
    );
  }, [allWaypoints, searchQuery]);

  const activeCount = allWaypoints.length - excludedIds.size;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md h-full bg-slate-950/90 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl text-slate-100">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">Waypoints & Photos</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                {activeCount} / {allWaypoints.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {allWaypoints.length} Geotagged
              {skippedFilesCount > 0 ? ` • ${skippedFilesCount} skipped (no GPS metadata)` : ''}
              {totalFilesCount > allWaypoints.length ? ` of ${totalFilesCount} uploaded` : ''}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Burst Photo Deduplication Toggle */}
        <div className="px-5 py-3.5 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
          <div className="pr-3">
            <span className="text-xs font-semibold text-slate-200 block">
              Merge Burst Shots (&lt;1m)
            </span>
            <span className="text-[11px] text-slate-400 block leading-tight">
              Collapse multiple photos taken at the exact same coordinates
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={mergeDuplicates}
              onChange={(e) => onToggleMergeDuplicates(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

        {/* Search & Bulk Actions */}
        <div className="p-4 border-b border-white/10 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by photo filename or #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
            />
          </div>

          {/* Bulk Button Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/5"
            >
              <CheckSquare className="w-3 h-3 text-sky-400" />
              Select All
            </button>
            <button
              onClick={onDeselectAll}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/5"
            >
              <Square className="w-3 h-3 text-slate-400" />
              Deselect All
            </button>
            <button
              onClick={onInvertSelection}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 border border-white/5"
            >
              <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
              Invert
            </button>
          </div>
        </div>

        {/* Waypoints List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredWaypoints.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No waypoints match "{searchQuery}"
            </div>
          ) : (
            filteredWaypoints.map((wpt, idx) => {
              const wptId = wpt.id || `wpt_${idx}`;
              const isExcluded = excludedIds.has(wptId);
              const isIncluded = !isExcluded;

              return (
                <div
                  key={wptId}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isIncluded
                      ? 'bg-slate-900/60 border-white/10 hover:border-white/20'
                      : 'bg-slate-950/40 border-slate-900/80 opacity-50'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => onToggleWaypoint(wptId)}
                    className="flex-shrink-0 text-slate-400 hover:text-sky-400 transition-colors"
                  >
                    {isIncluded ? (
                      <CheckSquare className="w-4 h-4 text-sky-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  {/* Thumbnail Placeholder */}
                  <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-white/5 flex items-center justify-center flex-shrink-0 text-slate-400">
                    <Camera className="w-4 h-4" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {wpt.name || `Waypoint #${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{Math.round(wpt.elevation)} m</span>
                      <span>•</span>
                      <span>{(wpt.distance / 1000).toFixed(2)} km</span>
                      {wpt.time && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(wpt.time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Fly-to Crosshair */}
                  <button
                    onClick={() => onFlyToPoint(wpt)}
                    title="Fly 3D Camera to Waypoint"
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-slate-400 hover:text-sky-300 transition-all flex-shrink-0"
                  >
                    <Crosshair className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Unselected photos are excluded from route stats & video</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
