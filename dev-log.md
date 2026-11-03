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


## [2026-11-04 02:58:00 +06:00] - Fix EXIF GPS Extraction Bug & Expand Image Formats
- **Root Cause Identified**: The `pick: ['latitude', 'longitude']` parameter in `exifr.parse()` caused `exifr` to discard raw TIFF GPS tags (`GPSLatitude`, `GPSLongitude`, etc.) because `'latitude'` is a synthesized property rather than an EXIF tag key. This caused `exifr` to return `undefined` on all geotagged photos.
- **Fix Implemented**:
  - Removed restrictive `pick` filter; `exifr` now parses the 64KB header and synthesizes `latitude`, `longitude`, and `GPSAltitude` properly.
  - Added multi-tier fallback: `exifr.gps(file)` and direct `ArrayBuffer` extraction.
  - Expanded accepted image types to include `.png`, `.webp`, `.avif`, `.tif`, `.tiff`, `.dng`, and `image/*`.
  - Added helpful diagnostics explaining why messaging-app transfers strip EXIF data.
- **Verification**:
  - Added real binary TIFF GPS header parsing unit test in `src/services/exifParser.test.ts`.
  - 26 unit tests passed; `npm run build` completed with zero errors.


## [2026-11-04 03:25:00 +06:00] - Apple Minimalist Aesthetic, Waypoint Manager & Advanced 3D Map Customization
- **Waypoint & Photo Selection Manager**:
  - Addressed user feedback regarding photo count discrepancy when importing large photo sets (e.g. 180 photos vs 130 imported). Previously, burst photos $<1\text{m}$ apart were unconditionally merged.
  - Added toggle in `WaypointDrawer`: *"Merge Burst Shots (<1m)"* vs *"Keep All Geotagged Photos"*.
  - Built `WaypointDrawer.tsx`: Apple-style frosted slide-over drawer with search filter, bulk actions (*Select All*, *Deselect All*, *Invert*), and individual waypoint toggles with timestamp, elevation, distance along trail, and 3D crosshair fly-to.
  - Built `recalculateTrekRoute` in `routeProcessor.ts` for instantaneous, zero-latency in-memory distance and elevation recalculations upon waypoint toggling without re-fetching DEM tiles.
- **Granular Video Duration & Editability**:
  - Extended `videoExporter.ts` and `ExportModal.tsx`:
    - Video duration now freely editable from $5\text{s}$ up to $180\text{s}$ (3 minutes) with direct numeric input and quick presets (15s, 30s, 60s, 90s, 120s, 180s).
    - Added $30\text{ FPS}$ vs $60\text{ FPS}$ frame rate selector for ultra-smooth 3D flight paths.
    - Added granular HUD layer visibility toggles: Live Telemetry Banner, Mini Elevation Profile Sparkline, App Brand Pill, and Bottom Progress Bar.
- **3D Map Themes, Atmospheric Lighting & Trail Customization**:
  - Created `src/config/mapThemes.ts`:
    - 4 Basemap Themes: *High-Res Satellite* (Esri), *Apple Minimal Dark* (Carto Dark Matter), *Alpine Topo & Contours* (OpenTopoMap), and *Warm Clay Minimal* (Carto Light).
    - 4 Atmospheric Sun & Shadow Angles: *Golden Hour Sunset* ($285^\circ$ azimuth, $18^\circ$ altitude, amber fog), *Alpine Morning Dawn* ($85^\circ$ azimuth, $22^\circ$ altitude, rose haze), *High Noon Clear Sky* ($180^\circ$ azimuth, $72^\circ$ altitude), and *Midnight Neon Glow* ($0^\circ$ azimuth, deep indigo).
    - 5 Trail Accent Colors: *Apple Orange* (`#ff9500`), *Alpine Cyan* (`#00e5ff`), *Trail Lime* (`#30d158`), *Hot Coral* (`#ff375f`), and *Deep Violet* (`#bf5af2`).
    - Dynamic Trail Line Width slider ($2\text{px}$ to $8\text{px}$) with live preview strip.
    - Waypoint Dot Density selector (*All Dots*, *Start & End Only*, *Hide Dots*).
  - Built `MapAppearanceModal.tsx` and refactored `Map3D.tsx` to dynamically update basemap raster tiles, `map.setSky()` atmosphere, line colors, line glow, and waypoint filters.
- **Apple Minimalist UI Redesign**:
  - Restyled `PlaybackControls.tsx` into a floating bottom glassmorphic dock (`bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl`).
  - Restyled `TelemetryHUD.tsx` with Apple Fitness / Health card design, crisp tabular numerals, and collapsible compact mode for distraction-free 3D cartography.
- **Verification**:
  - Created unit tests in `src/config/mapThemes.test.ts`.
  - 31 unit tests passed across 10 test suites; `npm run build` succeeded with zero TypeScript errors.
