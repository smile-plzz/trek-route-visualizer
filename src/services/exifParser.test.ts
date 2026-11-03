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
    const dummyBlob = new Blob(['dummy content without exif'], { type: 'image/jpeg' });
    const dummyFile = new File([dummyBlob], 'no_gps.jpg', { type: 'image/jpeg' });

    const result = await parsePhotoFiles([dummyFile]);
    expect(result.validPoints.length).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.totalCount).toBe(1);
  });

  it('extracts GPS coordinates from an image with GPS EXIF headers', async () => {
    // Construct standard binary TIFF buffer with GPSLatitude & GPSLongitude tags
    const buf = new Uint8Array(512);
    const view = new DataView(buf.buffer);

    // 'II*\0\x08\0\0\0'
    buf[0] = 0x49; buf[1] = 0x49; buf[2] = 42; buf[3] = 0;
    view.setUint32(4, 8, true); // IFD0 offset

    view.setUint16(8, 1, true); // 1 entry in IFD0
    view.setUint16(10, 0x8825, true); // GPSInfo tag
    view.setUint16(12, 4, true); // LONG
    view.setUint32(14, 1, true); // count
    view.setUint32(18, 26, true); // offset 26
    view.setUint32(22, 0, true); // next IFD

    // GPS IFD at offset 26 (4 entries: LatRef, Lat, LonRef, Lon)
    view.setUint16(26, 4, true);

    // Entry 1: GPSLatitudeRef (tag 1, ASCII, count 2, value 'N\0')
    view.setUint16(28, 1, true);
    view.setUint16(30, 2, true);
    view.setUint32(32, 2, true);
    buf[36] = 0x4e; buf[37] = 0;

    // Entry 2: GPSLatitude (tag 2, RATIONAL, count 3, offset 80)
    view.setUint16(40, 2, true);
    view.setUint16(42, 5, true);
    view.setUint32(44, 3, true);
    view.setUint32(48, 80, true);

    // Entry 3: GPSLongitudeRef (tag 3, ASCII, count 2, value 'E\0')
    view.setUint16(52, 3, true);
    view.setUint16(54, 2, true);
    view.setUint32(56, 2, true);
    buf[60] = 0x45; buf[61] = 0;

    // Entry 4: GPSLongitude (tag 4, RATIONAL, count 3, offset 104)
    view.setUint16(64, 4, true);
    view.setUint16(66, 5, true);
    view.setUint32(68, 3, true);
    view.setUint32(72, 104, true);

    // 45 deg 58 min 35 sec N (45.976388)
    view.setUint32(80, 45, true); view.setUint32(84, 1, true);
    view.setUint32(88, 58, true); view.setUint32(92, 1, true);
    view.setUint32(96, 35, true); view.setUint32(100, 1, true);

    // 7 deg 44 min 56 sec E (7.748888)
    view.setUint32(104, 7, true); view.setUint32(108, 1, true);
    view.setUint32(112, 44, true); view.setUint32(116, 1, true);
    view.setUint32(120, 56, true); view.setUint32(124, 1, true);

    const testFile = new File([buf], 'matterhorn_geotagged.jpg', { type: 'image/jpeg' });
    const result = await parsePhotoFiles([testFile]);

    expect(result.validPoints.length).toBe(1);
    expect(result.validPoints[0].lat).toBeCloseTo(45.9763, 3);
    expect(result.validPoints[0].lng).toBeCloseTo(7.7488, 3);
    expect(result.skippedCount).toBe(0);
  });
});
