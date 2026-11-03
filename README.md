# Trek Route Visualizer

> Turn a batch of geotagged photos or GPX files into an animated 3D map of your trek, entirely in the browser with zero backend and complete privacy.

[![MapLibre GL JS](https://img.shields.io/badge/MapLibre-3D%20Terrain-blue)](https://maplibre.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Backend-None%20(100%25%20Client--Side)-green)](#privacy--data-handling)

---

## Highlights

- 🏔️ **3D Terrain Cartography**: Renders mountain trails over global 3D elevation terrain using MapLibre GL JS and AWS Open Data Terrarium elevation tiles.
- 🔒 **100% Client-Side Privacy**: Only photo metadata headers (GPS & timestamp) are read. Photos are never decoded, displayed, or uploaded to any server.
- 📊 **Precision Telemetry**:
  - Distance computed via Haversine great-circle calculation.
  - Elevation enriched from Terrarium DEM tiles ($h = 256R + G + B/256 - 32768$) at zoom 12 with EXIF altitude fallback.
  - Elevation gain and loss filtered with a 4-meter hysteresis threshold to eliminate sensor noise.
- 🎬 **Animated Blue Dot Playback**: Constant distance-speed animation with interactive scrubbing and an intelligent 3D Follow-Camera that anticipates trail twists.
- 📹 **In-Browser Video Export**: Composites the 3D map view with a telemetry stats HUD overlay directly to MP4/WebM using HTML5 canvas and `MediaRecorder`.
- ⚡ **Instant Sample Route**: Try the complete experience in one click without uploading any files.

---

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Development
```bash
git clone https://github.com/smile-plzz/trektrack-photo-route.git # or local folder
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

1. **Photos never leave your device**: All EXIF processing occurs locally using `exifr`.
2. **Zero image decoding**: File contents are bypassed—only the small EXIF header is parsed.
3. **No accounts or cookies**: All session data remains in local browser memory until the tab is closed or the Reset button is clicked.
4. **Network requests**: The only outbound HTTP requests are for map tiles and elevation tiles.

---

## License
MIT

