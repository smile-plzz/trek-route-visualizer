# Trek Route Visualizer — Project Context & Constraints

## Goals
Turn a batch of geotagged photos or GPX files into an animated 3D map of a trek, entirely in the browser with zero server uploads and zero backend.
Provide real-time telemetry stats (distance, elevation gain/loss, min/max altitude, duration), interactive elevation profile scrubbing, 3D follow-camera playback, and direct in-browser video export via canvas recording.

## Operating Model & Audience
- **Target Audience**: Trekkers, hikers, outdoor photographers, travel bloggers, and expedition guides.
- **Privacy Model**: 100% Client-Side. Photo image content is never read, decoded, or uploaded. Only EXIF header metadata (coordinates, altitude, timestamp) is extracted via `exifr`.
- **Infrastructure**: Zero-backend static single-page web application deployable on GitHub Pages, Vercel, or Cloudflare Pages.

## Tech Stack
- **Framework & Bundler**: React 18 + TypeScript + Vite + Tailwind CSS
- **Map & 3D Terrain Engine**: MapLibre GL JS v4+ with 3D raster DEM terrain
- **Elevation Source**: AWS Open Data Terrarium PNG raster elevation tiles (`h = 256R + G + B/256 - 32768`)
- **Basemap Providers**:
  - Standard: OpenStreetMap / Carto Voyager raster tiles
  - Satellite: Esri World Imagery raster tiles
- **Parsers**:
  - `exifr`: Lightweight EXIF metadata header parsing for JPEG and HEIC
  - Browser native `DOMParser`: GPX XML trackpoint parsing
- **Recording & Video Export**: HTML5 Canvas compositing + Web `MediaRecorder` (`video/webm;codecs=vp9` or `video/mp4`)
- **Icons & UI**: Lucide React
- **Testing**: Vitest for unit testing geometry math, elevation decoding, hysteresis filtering, and parsers

## Non-Negotiable Constraints
1. **Never upload photos or coordinates**: All parsing and video rendering must execute client-side.
2. **Never decode whole image pixels in MVP**: Only read EXIF headers to ensure rapid ingestion of hundreds of photos.
3. **Noisy Altitude Filtering**: Real-world phone GPS altitudes can fluctuate wildly; enrich elevation with AWS Terrarium DEM tiles at zoom 12 with a 4-meter hysteresis threshold to filter noise.
4. **Resilience to sparse/missing data**: Skip non-geotagged photos cleanly without failing; fall back to filename sorting when timestamps are absent; provide informative summaries (e.g. "42 of 50 photos had GPS, 8 skipped").
5. **Instant sample experience**: Provide a built-in sample route for 1-click test without requiring user files.
