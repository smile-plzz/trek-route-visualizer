# Changelog

All notable changes to the **Trek Route Visualizer** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-04
### Added
- **Waypoint & Photo Selection Drawer (`WaypointDrawer.tsx`)**:
  - Slide-over inspector to individually view, search, and toggle any photo or waypoint on/off.
  - "Merge Burst Shots (<1m)" toggle vs "Keep All Geotagged Photos", clarifying photo count transparency.
  - Bulk actions (*Select All*, *Deselect All*, *Invert Selection*).
  - Crosshair button to fly the 3D camera to any waypoint coordinate.
  - Zero-latency in-memory distance and elevation recalculations.
- **Granular Video Duration & Editability (`ExportModal.tsx`)**:
  - Video animation duration slider and numeric input from $5\text{s}$ up to $180\text{s}$ (3 minutes).
  - Quick duration presets: *15s (Quick)*, *30s (Social)*, *60s (Standard)*, *90s (Relaxed)*, *120s (Slow Pan)*, *180s (Cinematic)*.
  - Frame rate toggle: $30\text{ FPS}$ vs $60\text{ FPS}$ (Ultra Smooth).
  - Layer visibility switches: Telemetry HUD, Elevation Profile Sparkline, App Brand Pill, Progress Bar.
- **3D Map Appearance & Atmospheric Customization (`MapAppearanceModal.tsx` & `mapThemes.ts`)**:
  - 4 Basemap Themes: *High-Res Satellite*, *Apple Minimal Dark*, *Alpine Topo & Contours*, and *Warm Clay Minimal*.
  - 4 Sun & Shadow Lighting Presets: *Golden Hour Sunset*, *Alpine Morning Dawn*, *High Noon Clear Sky*, and *Midnight Neon Glow*.
  - 5 Trail Color Accents: *Apple Orange*, *Alpine Cyan*, *Trail Lime*, *Hot Coral*, and *Deep Violet*.
  - Dynamic line width slider ($2\text{px}$ to $8\text{px}$) with live preview.
  - Waypoint dot density selector (*All Dots*, *Start & End Only*, *Hide Dots*).
- **Apple Minimalist UI Redesign**:
  - Floating bottom glassmorphic dock for playback and tools (`PlaybackControls.tsx`).
  - Redesigned Apple Fitness/Health telemetry cards with collapsible compact mode (`TelemetryHUD.tsx`).

## [1.0.0] - 2026-11-04
### Added
- **Multi-Aspect Video Export**:
  - 16:9 Landscape (Desktop / YouTube).
  - 9:16 Portrait (Instagram Reels / TikTok / YouTube Shorts) with stacked mobile HUD.
  - 1:1 Square (Feed posts).
- **Privacy Trim**:
  - Interactive trailhead and campsite masking ($0\text{m}$ to $2,000\text{m}$).
  - Fully recalculates distance offsets, elevation bounds, and gain/loss so sensitive locations are omitted from maps, profiles, and video recordings.
- **Clean GPX 1.1 Export**:
  - Download cleaned, elevation-enriched routes as standardized GPX 1.1 files with full roundtrip verification.
- **Multi-Day Route Splitting**:
  - Detects overnight gaps ($\ge 6\text{h}$) and splits routes into clean stages.
  - Interactive Day Selector tabs (`[All Stages]`, `[Day 1]`, `[Day 2]...`) with isolated day telemetry.
- **Configurable Map Infrastructure**:
  - Externalized tile provider configurations in `src/config/mapConfig.ts` with explicit attribution badges for OpenStreetMap, Carto, Esri, and AWS Open Data.
  - UI banner notifying users when GPX track takes priority over photos.

## [0.1.0] - 2026-11-04
### Added
- Initial release of Trek Route Visualizer MVP.
- 100% Client-side EXIF header reader and GPX track parser.
- 3D Terrain cartography via MapLibre GL JS and AWS Terrarium DEM.
- Haversine distance, 4m hysteresis elevation gain/loss, and elevation profile scrubber.
- Animated Traveling Blue Dot with 3D Follow Camera.
- In-browser canvas video recording via `MediaRecorder`.
- Built-in Matterhorn Alpine Ascent sample route.
