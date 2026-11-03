# Development Log: Trek Route Visualizer

## [2026-11-04 01:08:00 +06:00] - Project Inception & Planning
- Analyzed `smile-plzz/trektrack-photo-route` architectural learnings (2D Leaflet, Express backend, full photo decode) and synthesized the new pure client-side 3D terrain specification.
- Authored initial project documentation: `context.md`, `dev-log.md`, `CHANGELOG.md`, `README.md`.
- Formulated 8-stage processing pipeline: Input -> Parse -> Normalize -> Measure -> Enrich -> Analyze -> Render & Animate -> Video Export.


## [2026-11-04 01:17:00 +06:00] - MVP Build & Test Verification Complete
- **Scaffolding & Architecture**:
  - Configured React 18, TypeScript, Tailwind CSS, MapLibre GL JS, and Vitest.
  - Set up AWS Terrarium DEM 3D raster elevation decoding ($h = 256R + G + B/256 - 32768$) at zoom 12 with in-memory caching.
  - Implemented 4m hysteresis threshold filtering to eradicate GPS elevation noise.
  - Implemented client-side EXIF reader via `exifr` and GPX trackpoint parser via browser `DOMParser`.
- **UI & Cartography**:
  - Built `Map3D` with 3D terrain mesh, relief shading, OSM / Carto Voyager standard style, and Esri World Imagery satellite view.
  - Configured Glowing Route Polyline with 3D terrain elevation draping.
  - Created animated traveling Blue Dot with pulse radar ring and smooth Follow Camera bearing anticipation (5% / 250m ahead).
  - Built `TelemetryHUD` (distance, gain/loss, peak/valley elevation, duration, points count, and skipped files summary).
  - Built interactive SVG `ElevationChart` with real-time scrubber synchronized with the 3D map.
  - Built `PlaybackControls` with duration toggles (10s, 20s, 30s, 60s), Camera mode toggle (Follow vs Overview), 3D relief slider, and Reset button.
  - Built client-side `VideoExporter` and `ExportModal` using canvas HUD compositing and Web `MediaRecorder` (`video/mp4` / `video/webm`).
  - Added built-in Matterhorn Ascent sample trek for instant 1-click test.
- **Verification**:
  - `vitest`: 11 unit tests passed across 4 test suites (`geoUtils`, `terrariumService`, `gpxParser`, `routeProcessor`).
  - `npm run build`: Zero errors, clean production bundle created (`dist/`).


## [2026-11-04 01:52:00 +06:00] - Step 1: Verification Pass & Config Polish
- Externalized map tile URLs, maxzooms, and attributions into `src/config/mapConfig.ts`.
- Refactored `Map3D.tsx` to read dynamic tile config with attribution visible for OpenStreetMap contributors, Carto, Esri, and AWS Open Data.
- Added explicit user feedback in `TelemetryHUD` and `App.tsx` when both GPX and photos are supplied (GPX prioritization notice).
- Added test coverage in `src/services/exifParser.test.ts` for non-geotagged and empty file sets.
- Verification: 13 unit tests passed across 5 test suites; `npm run build` completed with zero errors.


## [2026-11-04 01:54:00 +06:00] - Step 2: Video Aspect Ratio Presets (16:9, 9:16, 1:1)
- Implemented `VideoAspectRatio` support for 16:9 Landscape, 9:16 Portrait (Shorts/Reels/TikTok), and 1:1 Square (Instagram Feed).
- Built responsive canvas compositor in `videoExporter.ts` that center-crops WebGL map frames without aspect distortion.
- Designed adaptive HUD overlay: dual 2x2 stacked cards for 9:16 vertical view, and 3-column banner for 16:9 landscape / 1:1 square view.
- Added aspect ratio selector buttons with icons in `ExportModal.tsx`.
- Added unit tests in `src/services/videoExporter.test.ts`.
- Verification: 17 unit tests passed across 6 test suites; `npm run build` completed with zero errors.


## [2026-11-04 01:57:00 +06:00] - Step 3: Privacy Trim (Start/End Concealment)
- Implemented `applyPrivacyTrim` in `src/services/privacyTrim.ts` to exclude coordinates within user-defined trailhead and campsite distances ($0$ to $2,000\text{m}$).
- Recomputed cumulative distances starting from zero and recalculated elevation gain/loss with 4m hysteresis so trimmed waypoints are never rendered or exported.
- Created `PrivacyTrimModal.tsx` with live interactive sliders for start and end trim.
- Wired Privacy Trim into `PlaybackControls.tsx` and `App.tsx` with memoized `activeRoute`.
- Added unit tests in `src/services/privacyTrim.test.ts`.
- Verification: 21 unit tests passed across 7 test suites; `npm run build` completed with zero errors.


## [2026-11-04 01:59:00 +06:00] - Step 4: Clean GPX 1.1 Export
- Implemented `buildGpxXml` and `downloadGpx` in `src/services/gpxExporter.ts` adhering to the official GPX 1.1 schema.
- Added XML sanitization and embedded high-precision track coordinates, enriched elevations, and ISO timestamps.
- Added unit tests in `src/services/gpxExporter.test.ts` including full roundtrip verification with `parseGpxString`.
- Added **Export GPX** button in `PlaybackControls.tsx` for 1-click downloads.
- Verification: 23 unit tests passed across 8 test suites; `npm run build` completed with zero errors.


## [2026-11-04 02:03:00 +06:00] - Step 5: Multi-Day Trail Segmentation
- Implemented `splitRouteByDays` in `src/services/multiDaySplitter.ts` detecting overnight rest gaps ($\ge 6\text{h}$) between timestamps.
- Created `DaySelector.tsx` displaying interactive stage tabs (`[All Stages]` `[Day 1]` `[Day 2]...`) with date labels.
- Synchronized day filtering across 3D Map, Elevation Profile scrubber, Telemetry HUD metrics, and Video Export.
- Added unit tests in `src/services/multiDaySplitter.test.ts`.
- Verification: 25 unit tests passed across 9 test suites; `npm run build` completed with zero errors.
