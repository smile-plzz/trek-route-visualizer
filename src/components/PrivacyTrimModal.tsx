import React from 'react';
import { X, Shield, EyeOff, RotateCcw, Check } from 'lucide-react';

interface PrivacyTrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDistance: number;
  startTrim: number;
  endTrim: number;
  onApplyTrim: (start: number, end: number) => void;
  onResetTrim: () => void;
}

export const PrivacyTrimModal: React.FC<PrivacyTrimModalProps> = ({
  isOpen,
  onClose,
  totalDistance,
  startTrim,
  endTrim,
  onApplyTrim,
  onResetTrim,
}) => {
  if (!isOpen) return null;

  const maxTrim = Math.round(Math.min(2000, totalDistance * 0.35));
  const remainingDist = Math.max(0, totalDistance - startTrim - endTrim);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Privacy Trim</h3>
            <p className="text-xs text-slate-400">
              Conceal home, campsite, or personal waypoints
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 mb-6 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
          <EyeOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Trimmed distances are completely removed from the 3D map, telemetry stats, elevation profile, and exported video.
          </span>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          {/* Start Trim */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                Hide Start (Trailhead)
              </span>
              <span className="font-mono font-bold text-amber-400">
                {startTrim >= 1000 ? `${(startTrim / 1000).toFixed(2)} km` : `${startTrim} m`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxTrim}
              step={50}
              value={startTrim}
              onChange={(e) => onApplyTrim(parseInt(e.target.value, 10), endTrim)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0 m</span>
              <span>Max: {maxTrim} m</span>
            </div>
          </div>

          {/* End Trim */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                Hide End (Finish/Camp)
              </span>
              <span className="font-mono font-bold text-amber-400">
                {endTrim >= 1000 ? `${(endTrim / 1000).toFixed(2)} km` : `${endTrim} m`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxTrim}
              step={50}
              value={endTrim}
              onChange={(e) => onApplyTrim(startTrim, parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0 m</span>
              <span>Max: {maxTrim} m</span>
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="block text-slate-400 text-[10px] uppercase font-bold">
              Visible Route Distance
            </span>
            <span className="font-mono font-bold text-white text-sm">
              {(remainingDist / 1000).toFixed(2)} km
            </span>
          </div>

          <div className="flex gap-2">
            {(startTrim > 0 || endTrim > 0) && (
              <button
                onClick={onResetTrim}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

