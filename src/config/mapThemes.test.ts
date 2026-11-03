import { describe, it, expect } from 'vitest';
import {
  MAP_THEMES,
  SUN_LIGHTING_MODES,
  TRAIL_COLORS,
  DEFAULT_APPEARANCE_SETTINGS,
} from '../config/mapThemes';

describe('mapThemes and appearance presets', () => {
  it('defines 4 distinct basemap themes with valid tile URLs', () => {
    const themeKeys = Object.keys(MAP_THEMES);
    expect(themeKeys).toHaveLength(4);
    expect(themeKeys).toContain('satellite');
    expect(themeKeys).toContain('apple-dark');
    expect(themeKeys).toContain('topo');
    expect(themeKeys).toContain('clay');

    for (const key of themeKeys) {
      const theme = MAP_THEMES[key as keyof typeof MAP_THEMES];
      expect(theme.tiles.length).toBeGreaterThan(0);
      expect(theme.tiles[0]).toMatch(/^https?:\/\//);
      expect(theme.maxzoom).toBeGreaterThanOrEqual(16);
      expect(theme.attribution).toBeDefined();
    }
  });

  it('defines 4 atmospheric sun lighting modes with realistic angles and hex colors', () => {
    const lightingKeys = Object.keys(SUN_LIGHTING_MODES);
    expect(lightingKeys).toHaveLength(4);
    expect(lightingKeys).toContain('golden-hour');
    expect(lightingKeys).toContain('alpine-morning');
    expect(lightingKeys).toContain('high-noon');
    expect(lightingKeys).toContain('midnight-glow');

    for (const key of lightingKeys) {
      const light = SUN_LIGHTING_MODES[key as keyof typeof SUN_LIGHTING_MODES];
      expect(light.azimuth).toBeGreaterThanOrEqual(0);
      expect(light.azimuth).toBeLessThanOrEqual(360);
      expect(light.altitude).toBeGreaterThanOrEqual(0);
      expect(light.altitude).toBeLessThanOrEqual(90);
      expect(light.skyColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(light.horizonColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('defines 5 vibrant trail color accents with glow pairs', () => {
    const colorKeys = Object.keys(TRAIL_COLORS);
    expect(colorKeys).toHaveLength(5);
    expect(colorKeys).toContain('apple-orange');
    expect(colorKeys).toContain('alpine-cyan');
    expect(colorKeys).toContain('trail-lime');
    expect(colorKeys).toContain('hot-coral');
    expect(colorKeys).toContain('deep-violet');

    for (const key of colorKeys) {
      const c = TRAIL_COLORS[key as keyof typeof TRAIL_COLORS];
      expect(c.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(c.glowHex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('provides valid default appearance settings', () => {
    expect(DEFAULT_APPEARANCE_SETTINGS.theme).toBe('satellite');
    expect(DEFAULT_APPEARANCE_SETTINGS.lighting).toBe('golden-hour');
    expect(DEFAULT_APPEARANCE_SETTINGS.trailColor).toBe('alpine-cyan');
    expect(DEFAULT_APPEARANCE_SETTINGS.lineWidth).toBe(4.5);
    expect(DEFAULT_APPEARANCE_SETTINGS.waypointDensity).toBe('all');
  });
});
