# Trek Route Visualizer

> Turn a batch of geotagged photos or GPX files into an animated 3D map of your trek, entirely in the browser with zero backend and complete privacy.

[![MapLibre GL JS](https://img.shields.io/badge/MapLibre-3D%20Terrain-blue)](https://maplibre.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Backend-None%20(100%25%20Client--Side)-green)](#privacy--data-handling)

---

## Highlights

- 🏔️ **3D Terrain Cartography**: Renders mountain trails over global 3D elevation terrain using MapLibre GL JS and AWS Open Data Terrarium elevation tiles.
- 🎨 **Map Appearance & Atmospheric Lighting**:
  - **4 Basemap Themes**: High-Res Satellite, Apple Minimal Dark, Alpine Topo & Contours, Warm Clay Minimal.
  - **4 Sun & Shadow Modes**: Golden Hour Sunset, Alpine Morning Dawn, High Noon Clear Sky, Midnight Neon Glow.
  - **Custom Trail Accents**: Apple Orange, Alpine Cyan, Trail Lime, Hot Coral, Deep Violet, with adjustable line width ($2\text{px}$–$8\text{px}$) and waypoint density.
- 📍 **Waypoint & Photo Selection Drawer**:
  - Slide-over inspector to individually view, search, and toggle any photo or waypoint on/off.
  - "Merge Burst Shots (<1m)" toggle vs "Keep All Geotagged Photos", clarifying photo count transparency.
  - Zero-latency in-memory distance and elevation recalculations.
  - Quick crosshair fly-to on the 3D map for any coordinate.
- 🎬 **Granular Video Duration & Editability**:
  - Video animation duration slider and numeric input from $5\text{s}$ up to $180\text{s}$ (3 minutes).
  - Multi-aspect ratios: 16:9 Landscape, 9:16 Portrait (Reels/Shorts), 1:1 Square (Feed).
  - 30 FPS vs 60 FPS recording.
  - Layer visibility switches: Telemetry HUD, Mini Elevation Profile Sparkline, App Brand Pill, Progress Bar.
- 🛡️ **Privacy Trailhead Trim**: Mask sensitive start and end coordinates ($0$ to $2,000\text{m}$) before sharing.
- 📅 **Multi-Day Stage Segmentation**: Automatic overnight rest detection ($\ge 6\text{h}$) with isolated day telemetry tabs.
- 📥 **Clean GPX 1.1 Export**: Download elevation-enriched tracks as standardized GPX 1.1 XML.
- 🔒 **100% Client-Side Privacy**: Only photo metadata headers (GPS & timestamp) are read. Photos are never decoded, displayed, or uploaded to any server.
- ⚡ **Instant Sample Route**: Try the complete experience in one click with the built-in Matterhorn Alpine Ascent route.

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Development
```bash
cd trek-route-visualizer
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Testing
```bash
npm run test
```

---

## Privacy & Data Handling

1. **All processing happens in the browser**: Zero server uploads, zero cookies, zero local storage.
2. **Never read image pixels**: Only coordinates, altitudes, timestamps, and filenames are parsed from EXIF headers.
3. **External requests**: Only map and DEM elevation tile requests leave the device.

---

## License

MIT © 2026 Ismail
