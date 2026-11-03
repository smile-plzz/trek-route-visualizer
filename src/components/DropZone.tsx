import React, { useState, useRef } from 'react';
import { Upload, Compass, ShieldCheck, Mountain, FileCode, Sparkles } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSample: () => void;
  isLoading: boolean;
  progressText?: string;
  progressPercent?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onLoadSample,
  isLoading,
  progressText,
  progressPercent,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[620px] max-w-3xl mx-auto p-8 text-center">
      {/* Privacy Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
        <ShieldCheck className="w-4 h-4" />
        <span>100% Client-Side Privacy • Photos Never Leave Your Device</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
        Trek Route <span className="text-sky-400">Visualizer</span>
      </h1>
      <p className="text-slate-400 text-base md:text-lg max-w-xl mb-8 leading-relaxed">
        Transform your geotagged photos or GPX tracks into an animated 3D terrain map with real-time telemetry stats and shareable video export.
      </p>

      {/* Drop Target Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`w-full p-10 md:p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragOver
            ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.heic,.heif,.gpx"
          onChange={handleFileChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center py-6">
            <div className="w-12 h-12 mb-4 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
            <p className="text-white font-semibold text-base mb-2">
              {progressText || 'Extracting metadata...'}
            </p>
            {typeof progressPercent === 'number' && (
              <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-sky-400 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
            <span className="text-xs text-slate-500 mt-3 font-mono">
              Reading EXIF headers directly in browser
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <p className="text-lg font-bold text-white mb-1">
              Drop photos or GPX files here
            </p>
            <p className="text-sm text-slate-400 mb-5">
              or <span className="text-sky-400 font-semibold underline underline-offset-2">browse files</span> from your computer
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-medium">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" /> JPEG / HEIC
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-sky-400" /> GPX Tracks
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-sky-400" /> 3D Elevation
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Launch Sample Route */}
      <div className="mt-8 flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">
          Don't have trek photos on hand?
        </span>
        <button
          onClick={onLoadSample}
          disabled={isLoading}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-sky-200" />
          <span>Try Sample Route: Matterhorn Ascent</span>
        </button>
      </div>
    </div>
  );
};
