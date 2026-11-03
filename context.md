# Trek Route Visualizer — Project Context & Constraints

## Goals
Turn a batch of geotagged photos or GPX files into an animated 3D map of a trek, entirely in the browser with zero server uploads and zero backend.
Provide real-time telemetry stats (distance, elevation gain/loss, min/max altitude, duration), interactive elevation profile scrubbing, 3D follow-camera playback, multi-theme 3D cartography, and direct in-browser video export via canvas recording.

## Operating Model & Audience
- **Target Audience**: Trekkers, hikers, outdoor photographers, travel bloggers, and expedition guides.
- **Privacy Model**: 100% Client-Side. Photo image content is never read, decoded, or uploaded. Only EXIF header metadata (coordinates, altitude, timestamp) is extracted via `exifr`.
- **Infrastructure**: Zero-backend static single-page web application deployable on GitHub Pages, Vercel, or Cloudflare Pages.

## Tech Stack
- **Framework & Bundler**: React 18 + TypeScript + Vite + Tailwind CSS
- **Map & 3D Terrain Engine**: MapLibre GL JS v4+ with 3D raster DEM terrain and dynamic `setSky` atmosphere
- **Elevation Source**: AWS Open Data Terrarium PNG raster elevation tiles (`h = 256R + G + B/256 - 32768`)
- **Basemap Providers & Themes**:
  - High-Res Satellite: Esri World Imagery
  - Apple Minimal Dark: Carto Dark Matter
  - Alpine Topo & Contours: OpenTopoMap
  - Warm Clay Minimal: Carto Light
- **Lighting Atmospheres**: Golden Hour Sunset, Alpine Morning Dawn, High Noon Clear Sky, Midnight Neon Glow
- **Parsers**:
  - `exifr`: Lightweight EXIF metadata header parsing for JPEG, HEIC, PNG, WebP, AVIF, TIFF, DNG
  - Browser native `DOMParser`: GPX XML trackpoint parsing
- **Recording & Video Export**: HTML5 Canvas compositing + Web `MediaRecorder` (`video/webm;codecs=vp9` or `video/mp4`), configurable 5s–180s, 30/60 FPS, multi-aspect ratio (16:9, 9:16, 1:1)
- **Icons & UI**: Lucide React, Apple Minimalist frosted glassmorphism (`backdrop-blur-2xl`)
- **Testing**: Vitest for unit testing geometry math, elevation decoding, hysteresis filtering, themes, and parsers

## Non-Negotiable Constraints
1. **Never upload photos or coordinates**: All parsing and video rendering must execute client-side.
2. **Never decode whole image pixels in MVP**: Only read EXIF headers to ensure rapid ingestion of hundreds of photos.
3. **Noisy Altitude Filtering**: Real-world phone GPS altitudes can fluctuate wildly; enrich elevation with AWS Terrarium DEM tiles at zoom 12 with a 4-meter hysteresis threshold to filter noise.
4. **Resilience to sparse/missing data**: Skip non-geotagged photos cleanly without failing; fall back to filename sorting when timestamps are absent; provide informative summaries (e.g. "42 of 50 photos had GPS, 8 skipped").
5. **Instant sample experience**: Provide a built-in sample route for 1-click test without requiring user files.
6. **Waypoint Transparency**: Users retain full control to include/exclude any photo and choose whether burst photos at identical coordinates (<1m) are merged or kept.
