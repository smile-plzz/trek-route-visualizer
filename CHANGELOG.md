# Changelog

All notable changes to the **Trek Route Visualizer** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
