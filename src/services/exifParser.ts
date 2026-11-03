import exifr from 'exifr';
import { RawPoint } from '../types';

export interface ExifExtractionResult {
  validPoints: RawPoint[];
  skippedCount: number;
  totalCount: number;
}

/**
 * Extracts GPS metadata from image files using exifr.
 * Only parses metadata headers—the image itself is NEVER decoded or loaded into memory.
 */
export async function parsePhotoFiles(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<ExifExtractionResult> {
  const BATCH_SIZE = 8;
  const validPoints: RawPoint[] = [];
  let skippedCount = 0;
  let processedCount = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const chunk = files.slice(i, i + BATCH_SIZE);
    const chunkPromises = chunk.map(async (file) => {
      try {
        // Strategy 1: Fast header parse via File object
        let data: any = await exifr.parse(file, {
          tiff: true,
          exif: true,
          gps: true,
          xmp: true,
          mergeOutput: true,
        }).catch(() => null);

        // Strategy 2: Dedicated exifr.gps lookup if latitude not present
        if (!data || typeof data.latitude !== 'number' || isNaN(data.latitude)) {
          const gpsOnly = await exifr.gps(file).catch(() => null);
          if (gpsOnly && typeof gpsOnly.latitude === 'number') {
            data = { ...(data || {}), ...gpsOnly };
          }
        }

        // Strategy 3: ArrayBuffer fallback (for webworkers/node/sandboxed environments)
        if ((!data || typeof data.latitude !== 'number') && typeof file.arrayBuffer === 'function') {
          try {
            const ab = await file.arrayBuffer();
            data = await exifr.parse(ab, {
              tiff: true,
              exif: true,
              gps: true,
              xmp: true,
              mergeOutput: true,
            }).catch(() => null);

            if (!data || typeof data.latitude !== 'number') {
              const gpsOnly = await exifr.gps(ab).catch(() => null);
              if (gpsOnly && typeof gpsOnly.latitude === 'number') {
                data = { ...(data || {}), ...gpsOnly };
              }
            }
          } catch {
            // ignore buffer read error
          }
        }

        let lat: number | undefined = data?.latitude;
        let lng: number | undefined = data?.longitude;

        // If coordinates were parsed, construct valid point
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          // Resolve timestamp (DateTimeOriginal -> CreateDate -> ModifyDate -> file.lastModified)
          let timestamp: number | undefined;
          if (data?.DateTimeOriginal instanceof Date) {
            timestamp = data.DateTimeOriginal.getTime();
          } else if (data?.CreateDate instanceof Date) {
            timestamp = data.CreateDate.getTime();
          } else if (data?.ModifyDate instanceof Date) {
            timestamp = data.ModifyDate.getTime();
          } else if (typeof data?.DateTimeOriginal === 'string') {
            const parsed = Date.parse(data.DateTimeOriginal);
            if (!isNaN(parsed)) timestamp = parsed;
          } else if (typeof file.lastModified === 'number' && file.lastModified > 0) {
            timestamp = file.lastModified;
          }

          // Resolve GPS Altitude
          let gpsAltitude: number | undefined;
          if (typeof data?.GPSAltitude === 'number' && !isNaN(data.GPSAltitude)) {
            // In EXIF GPSAltitudeRef: 1 = Below sea level, 0 = Above sea level
            gpsAltitude = data.GPSAltitudeRef === 1 ? -data.GPSAltitude : data.GPSAltitude;
          } else if (typeof data?.altitude === 'number' && !isNaN(data.altitude)) {
            gpsAltitude = data.altitude;
          }

          return {
            lat,
            lng,
            time: timestamp,
            gpsAltitude,
            name: file.name,
          } as RawPoint;
        }

        return null;
      } catch (err) {
        console.warn(`Could not parse EXIF for ${file.name}`, err);
        return null;
      }
    });

    const results = await Promise.all(chunkPromises);
    for (const res of results) {
      if (res) {
        validPoints.push(res);
      } else {
        skippedCount++;
      }
    }

    processedCount += chunk.length;
    onProgress?.(processedCount, files.length);
  }

  return {
    validPoints,
    skippedCount,
    totalCount: files.length,
  };
}
