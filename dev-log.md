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
