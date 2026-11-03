import React from 'react';
import {
  X,
  Palette,
  Sun,
  Sunset,
  Sunrise,
  Moon,
  Layers,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import {
  MapAppearanceSettings,
  MapThemeId,
  SunLightingId,
  TrailColorId,
  WaypointDensity,
} from '../types';
import {
  MAP_THEMES,
  SUN_LIGHTING_MODES,
  TRAIL_COLORS,
} from '../config/mapThemes';

interface MapAppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MapAppearanceSettings;
  onChangeSettings: (newSettings: MapAppearanceSettings) => void;
}

export const MapAppearanceModal: React.FC<MapAppearanceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
}) => {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof MapAppearanceSettings>(
    key: K,
    val: MapAppearanceSettings[K]
  ) => {
    onChangeSettings({
      ...settings,
      [key]: val,
    });
  };

  const getLightingIcon = (id: SunLightingId) => {
    switch (id) {
      case 'golden-hour':
        return <Sunset className="w-4 h-4 text-amber-400" />;
      case 'alpine-morning':
        return <Sunrise className="w-4 h-4 text-rose-400" />;
      case 'high-noon':
        return <Sun className="w-4 h-4 text-yellow-300" />;
      case 'midnight-glow':
        return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  const activeTrail = TRAIL_COLORS[settings.trailColor] || TRAIL_COLORS['alpine-cyan'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-sky-400 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Map & Atmosphere</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize 3D terrain themes, atmospheric lighting, and trail styling.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Basemap Themes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              1. Basemap Cartography
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(MAP_THEMES) as MapThemeId[]).map((themeKey) => {
                const theme = MAP_THEMES[themeKey];
                const isSelected = settings.theme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => updateSetting('theme', themeKey)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{theme.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                      {theme.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Sun & Atmospheric Lighting */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              2. Atmospheric Sun & Shadows
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(SUN_LIGHTING_MODES) as SunLightingId[]).map((lightingKey) => {
                const mode = SUN_LIGHTING_MODES[lightingKey];
                const isSelected = settings.lighting === lightingKey;
                return (
                  <button
                    key={lightingKey}
                    type="button"
                    onClick={() => updateSetting('lighting', lightingKey)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{getLightingIcon(lightingKey)}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white leading-snug">{mode.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                        {mode.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Trail Color Accent */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              3. Trail Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(TRAIL_COLORS) as TrailColorId[]).map((colorKey) => {
                const colorDef = TRAIL_COLORS[colorKey];
                const isSelected = settings.trailColor === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => updateSetting('trailColor', colorKey)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-white/15 border-white text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{
                        backgroundColor: colorDef.hex,
                        boxShadow: `0 0 8px ${colorDef.glowHex}`,
                      }}
                    />
                    <span>{colorDef.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Trail Width Slider & Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                4. Trail Line Width: <span className="text-white font-mono">{settings.lineWidth}px</span>
              </label>
              {/* Live Preview Strip */}
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-white/10">
                <div
                  className="w-16 rounded-full"
                  style={{
                    height: `${settings.lineWidth}px`,
                    backgroundColor: activeTrail.hex,
                    boxShadow: `0 0 6px ${activeTrail.glowHex}`,
                  }}
                />
              </div>
            </div>

            <input
              type="range"
              min={2}
              max={8}
              step={0.5}
              value={settings.lineWidth}
              onChange={(e) => updateSetting('lineWidth', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 transition-all"
            />
          </div>

          {/* Section 5: Waypoint Dot Density */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              5. Waypoint Dot Density
            </label>
            <div className="flex rounded-xl bg-slate-900 border border-white/10 p-1">
              <button
                type="button"
                onClick={() => updateSetting('waypointDensity', 'all')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  settings.waypointDensity === 'all'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Dots
              </button>
              <button
                type="button"
                onClick={() => updateSetting('waypointDensity', 'turns')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  settings.waypointDensity === 'turns'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Start & End Only
              </button>
              <button
                type="button"
                onClick={() => updateSetting('waypointDensity', 'none')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  settings.waypointDensity === 'none'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hide Dots
              </button>
            </div>
          </div>
        </div>

        {/* Footer Done Button */}
        <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-sky-500/20"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
