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
        const data = await exifr.parse(file, {
          pick: [
            'latitude',
            'longitude',
            'altitude',
            'GPSAltitude',
            'DateTimeOriginal',
            'CreateDate',
            'ModifyDate',
          ],
        });

        if (
          data &&
          typeof data.latitude === 'number' &&
          typeof data.longitude === 'number' &&
          !isNaN(data.latitude) &&
          !isNaN(data.longitude)
        ) {
          const timestamp =
            data.DateTimeOriginal instanceof Date
              ? data.DateTimeOriginal.getTime()
              : data.CreateDate instanceof Date
              ? data.CreateDate.getTime()
              : undefined;

          const gpsAltitude =
            typeof data.altitude === 'number'
              ? data.altitude
              : typeof data.GPSAltitude === 'number'
              ? data.GPSAltitude
              : undefined;

          return {
            lat: data.latitude,
            lng: data.longitude,
            time: timestamp,
            gpsAltitude,
            name: file.name,
          } as RawPoint;
        } else {
          return null;
        }
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
