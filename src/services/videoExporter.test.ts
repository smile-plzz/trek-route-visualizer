import { describe, it, expect } from 'vitest';
import { getExportDimensions, getSupportedMimeType } from './videoExporter';

describe('videoExporter', () => {
  it('computes correct dimensions for 16:9 Landscape', () => {
    const d1080 = getExportDimensions('16:9', '1080p');
    expect(d1080.width).toBe(1920);
    expect(d1080.height).toBe(1080);

    const d720 = getExportDimensions('16:9', '720p');
    expect(d720.width).toBe(1280);
    expect(d720.height).toBe(720);
  });

  it('computes correct dimensions for 9:16 Portrait (Reels/Shorts)', () => {
    const d1080 = getExportDimensions('9:16', '1080p');
    expect(d1080.width).toBe(1080);
    expect(d1080.height).toBe(1920);

    const d720 = getExportDimensions('9:16', '720p');
    expect(d720.width).toBe(720);
    expect(d720.height).toBe(1280);
  });

  it('computes correct dimensions for 1:1 Square (Feed posts)', () => {
    const d1080 = getExportDimensions('1:1', '1080p');
    expect(d1080.width).toBe(1080);
    expect(d1080.height).toBe(1080);

    const d720 = getExportDimensions('1:1', '720p');
    expect(d720.width).toBe(720);
    expect(d720.height).toBe(720);
  });

  it('provides a valid video mimeType fallback', () => {
    const { mimeType, extension } = getSupportedMimeType();
    expect(mimeType).toBeDefined();
    expect(['mp4', 'webm']).toContain(extension);
  });
});

