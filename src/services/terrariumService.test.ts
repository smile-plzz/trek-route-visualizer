import { describe, it, expect } from 'vitest';
import {
  decodeTerrariumRGB,
  latLngToTileCoord,
  TERRARIUM_ZOOM,
} from './terrariumService';

describe('terrariumService', () => {
  it('decodes Terrarium RGB accurately per specification formula', () => {
    // Formula: h = 256 * R + G + (B / 256) - 32768
    // R = 128, G = 0, B = 0 -> 256 * 128 - 32768 = 0m (sea level)
    expect(decodeTerrariumRGB(128, 0, 0)).toBe(0);

    // R = 128, G = 100, B = 0 -> 100m
    expect(decodeTerrariumRGB(128, 100, 0)).toBe(100);

    // Mount Everest height: 8848.86m -> 32768 + 8849 = 41617 -> R=162 (41472), G=145, B=0
    expect(decodeTerrariumRGB(162, 145, 0)).toBe(8849);

    // Below sea level: Dead Sea ~ -430m -> 32768 - 430 = 32338 -> R=126 (32256), G=82, B=0
    expect(decodeTerrariumRGB(126, 82, 0)).toBe(-430);
  });

  it('computes valid tile indices and pixel positions within [0, 255]', () => {
    // Coordinate: Zermatt / Matterhorn area (45.9763, 7.7491)
    const tile = latLngToTileCoord(45.9763, 7.7491, TERRARIUM_ZOOM);
    expect(tile.z).toBe(TERRARIUM_ZOOM);
    expect(tile.x).toBeGreaterThan(0);
    expect(tile.y).toBeGreaterThan(0);
    expect(tile.px).toBeGreaterThanOrEqual(0);
    expect(tile.px).toBeLessThanOrEqual(255);
    expect(tile.py).toBeGreaterThanOrEqual(0);
    expect(tile.py).toBeLessThanOrEqual(255);
  });
});

