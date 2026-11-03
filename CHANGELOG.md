# Changelog

All notable changes to the **Trek Route Visualizer** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-04
### Added
- Project initialization with Vite, React, TypeScript, and Tailwind CSS.
- Client-side EXIF reader via `exifr` and GPX XML parser via native `DOMParser`.
- Haversine distance, bearing, and route segment interpolation utilities.
- AWS Terrarium DEM elevation decoder ($h = 256R + G + B/256 - 32768$) with 4m hysteresis threshold filtering.
- 3D Terrain cartography using MapLibre GL JS with AWS Terrarium DEM and adjustable relief exaggeration.
- Dual basemap support: Standard topographic and Satellite aerial view.
- Real-time Telemetry HUD (distance, gain/loss, min/max altitude, duration).
- Interactive elevation profile with scrubbing cursor synchronized with map waypoints.
- Animation playback engine with Traveling Blue Dot and 3D Follow-Camera.
- In-browser Video Exporter using canvas HUD compositing and `MediaRecorder`.
- Built-in sample mountain trek route for 1-click evaluation.
- Privacy guarantee: 100% client-side with zero server image uploads.
