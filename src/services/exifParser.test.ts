import { describe, it, expect } from 'vitest';
import { parsePhotoFiles } from './exifParser';

describe('exifParser', () => {
  it('handles empty file list cleanly without errors', async () => {
    const result = await parsePhotoFiles([]);
    expect(result.validPoints).toEqual([]);
    expect(result.skippedCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it('correctly skips non-image or non-geotagged files', async () => {
    // Construct fake files with no EXIF
    const dummyBlob = new Blob(['dummy content'], { type: 'image/jpeg' });
    const dummyFile = new File([dummyBlob], 'no_gps.jpg', { type: 'image/jpeg' });

    const result = await parsePhotoFiles([dummyFile]);
    expect(result.validPoints.length).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.totalCount).toBe(1);
  });
});

