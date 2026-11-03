import React, { useRef, useState, useMemo } from 'react';
import { TrekPoint } from '../types';

interface ElevationChartProps {
  points: TrekPoint[];
  currentDistance: number;
  onScrubDistance: (distance: number) => void;
}

export const ElevationChart: React.FC<ElevationChartProps> = ({
  points,
  currentDistance,
  onScrubDistance,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    distance: number;
    elevation: number;
  } | null>(null);

  const { minEle, maxEle, totalDist, pathData, areaData, pointsWithXY } = useMemo(() => {
    if (points.length < 2) {
      return {
        minEle: 0,
        maxEle: 1000,
        totalDist: 1000,
        pathData: '',
        areaData: '',
        pointsWithXY: [],
      };
    }

    let min = points[0].elevation;
    let max = points[0].elevation;
    for (const p of points) {
      if (p.elevation < min) min = p.elevation;
      if (p.elevation > max) max = p.elevation;
    }

    // Add 10% breathing room to elevation range
    const elePadding = Math.max(20, (max - min) * 0.1);
    const rangeMin = Math.max(0, min - elePadding);
    const rangeMax = max + elePadding;
    const eleSpan = rangeMax - rangeMin || 1;

    const totalD = points[points.length - 1].distance || 1;

    // Normalize to 1000x200 SVG coordinates
    const width = 1000;
    const height = 180;
    const paddingBottom = 20;
    const chartHeight = height - paddingBottom;

    const ptsXY = points.map((p) => {
      const x = (p.distance / totalD) * width;
      const y = chartHeight - ((p.elevation - rangeMin) / eleSpan) * chartHeight;
      return { x, y, p };
    });

    const dPath = ptsXY.reduce(
      (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      ''
    );

    const dArea = `${dPath} L ${width},${chartHeight} L 0,${chartHeight} Z`;

    return {
      minEle: Math.round(min),
      maxEle: Math.round(max),
      totalDist: totalD,
      pathData: dPath,
      areaData: dArea,
      pointsWithXY: ptsXY,
    };
  }, [points]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || points.length < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetDist = ratio * totalDist;

    // Find nearest point for tooltip
    let nearest = points[0];
    let minDiff = Infinity;
    for (const p of points) {
      const diff = Math.abs(p.distance - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = p;
      }
    }

    setHoverData({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      distance: targetDist,
      elevation: nearest.elevation,
    });

    if (e.buttons === 1) {
      onScrubDistance(targetDist);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || points.length < 2) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onScrubDistance(ratio * totalDist);
  };

  const currentRatio = totalDist > 0 ? Math.min(1, Math.max(0, currentDistance / totalDist)) : 0;
  const cursorXPercent = currentRatio * 100;

  return (
    <div className="relative w-full bg-slate-950/80 rounded-2xl border border-slate-800/80 p-3 backdrop-blur-xl shadow-2xl">
      {/* Top Labels */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Elevation Profile
          </span>
          <span className="text-[10px] text-slate-500">
            (Scrubbable • Terrarium 3D DEM)
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Min: <strong className="text-slate-200">{minEle}m</strong></span>
          <span>Max: <strong className="text-sky-400">{maxEle}m</strong></span>
        </div>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={() => setHoverData(null)}
        className="relative w-full h-24 md:h-28 cursor-ew-resize select-none overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800/50"
      >
        <svg
          viewBox="0 0 1000 180"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="40" x2="1000" y2="40" stroke="#334155" strokeWidth="0.8" strokeDasharray="4 4" />
          <line x1="0" y1="90" x2="1000" y2="90" stroke="#334155" strokeWidth="0.8" strokeDasharray="4 4" />
          <line x1="0" y1="140" x2="1000" y2="140" stroke="#334155" strokeWidth="0.8" strokeDasharray="4 4" />

          {/* Filled Elevation Area */}
          <path d={areaData} fill="url(#elevationGrad)" />

          {/* Elevation Stroke Line */}
          <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Live Scrubber Playback Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-[0_0_12px_#38bdf8] pointer-events-none transition-all duration-75"
          style={{ left: `${cursorXPercent}%` }}
        >
          <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-sky-500 shadow-md" />
        </div>

        {/* Hover Inspector Tooltip */}
        {hoverData && (
          <div
            className="absolute -top-1 transform -translate-y-full -translate-x-1/2 bg-slate-900/95 border border-sky-500/50 text-white px-2.5 py-1 rounded-lg text-[11px] font-mono shadow-xl pointer-events-none z-20 backdrop-blur-md"
            style={{ left: `${hoverData.x}px` }}
          >
            <span>{Math.round(hoverData.elevation)}m</span>
            <span className="text-slate-400 ml-1.5">
              ({hoverData.distance >= 1000 ? `${(hoverData.distance / 1000).toFixed(1)}km` : `${Math.round(hoverData.distance)}m`})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

