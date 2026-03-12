# MediaEditor

> **Open-source, browser-based media editor** — a Canva-inspired toolkit for images and videos, built with modern web technologies and AI capabilities.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🖼️ Image Editor
- **Fabric.js canvas** — drag, resize, rotate any object
- **Layers panel** — reorder, hide, lock layers
- **Filters** — Grayscale, Sepia, Invert, Brightness, Contrast, Saturation, Blur, Sharpen, Vintage
- **Text tool** — add and edit text directly on canvas
- **Free draw** — freehand brush with configurable color & width
- **Upload images** — add images from your device
- **Export** — PNG, JPEG, WebP at 0.5×, 1×, or 2× resolution with quality control
- **Undo / Redo** — full history stack

### 🎬 Video Editor
- **FFmpeg.wasm** — all processing runs in-browser, no server required
- **Trim & Cut** — set in/out points with draggable handles or precise time inputs
- **Add Audio** — merge any MP3/WAV/AAC audio file into your video
- **Live playhead** — real-time timeline position tracking
- **Click-to-seek** — click anywhere on the timeline to jump
- **Zoom timeline** — 50%–400% zoom on the track area
- **Export** — download processed video as MP4 or WebM

### 🌐 Internationalization
- English (`/en`) and Vietnamese (`/vi`) via **next-intl**
- Language switcher in the toolbar with locale-aware routing

---

## 🏗️ Architecture

```
editor/
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router)
│   │   ├── src/
│   │   │   ├── app/[locale]/   # Locale-aware pages
│   │   │   ├── components/     # UI components
│   │   │   │   └── editor/     # Toolbar, Sidebar, Panels, Modals
│   │   │   ├── hooks/          # useImageEditor, useVideoEditor
│   │   │   ├── stores/         # Zustand state (editorStore, videoStore)
│   │   │   └── messages/       # i18n — en.json, vi.json
│   │   └── public/ffmpeg/      # FFmpeg.wasm core files (served statically)
│   └── api/          # (Planned) Fastify API — remove-bg, upscale
├── docker-compose.yml
└── README.md
```

### Key tech choices

| Concern | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Image editing | Fabric.js v7 |
| Video processing | FFmpeg.wasm v0.11 (browser-native) |
| State management | Zustand |
| i18n | next-intl v4 |
| Icons | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20
- **npm** ≥ 10

### Development

```bash
# 1. Clone the repo
git clone https://github.com/Danh164/media_editor.git
cd media_editor

# 2. Install dependencies (root)
make install

# 3. Start development servers
# Terminal 1: Frontend
make dev-web

# Terminal 2: API
make dev-api
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available routes

| Route | Description |
|---|---|
| `/en` | Home page (English) |
| `/vi` | Home page (Vietnamese) |
| `/en/editor/image` | Image editor |
| `/en/editor/video` | Video editor |

---

## 🐳 Docker

### Build and run with Docker Compose

```bash
# From the monorepo root
docker compose up --build
```

The web app will be available at [http://localhost:3000](http://localhost:3000).

### Build the web image manually

```bash
cd apps/web
docker build -t media-editor-web .
docker run -p 3000:3000 media-editor-web
```

> **Note:** The Docker image uses Next.js **standalone** output. Make sure `next.config.mjs` includes `output: 'standalone'` for the Docker build to work correctly.

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `src/hooks/useImageEditor.ts` | Fabric.js canvas setup, object management, event handling |
| `src/hooks/useVideoEditor.ts` | FFmpeg.wasm loading (via script tag), trim, audio merge |
| `src/stores/editorStore.ts` | Image editor state — canvas, active object, history, tools |
| `src/stores/videoStore.ts` | Video editor state — url, trim points, processing, current time |
| `src/components/editor/ExportModal.tsx` | Image/video export dialog (format, quality, resolution) |
| `src/components/editor/TrimPanel.tsx` | Video trim UI with time inputs and range indicator |
| `src/components/editor/AudioPanel.tsx` | Audio file merge UI with preview and volume control |
| `src/messages/en.json` | English translations |
| `src/messages/vi.json` | Vietnamese translations |
| `public/ffmpeg/` | Locally served FFmpeg.wasm core (bypasses Webpack bundler) |

---

## 🗺️ Roadmap

- [x] **`apps/api`** — Fastify API for AI features (remove-bg, upscale)
- [x] **AI Remove Background** — calls the Fastify `/remove-bg` endpoint
- [x] **AI Upscale** — calls the Fastify `/upscale` endpoint
- [ ] **Subtitle editor** — add/edit SRT subtitles burned in via FFmpeg
- [ ] **Video split** — split clip at playhead
- [ ] **Cloud save** — save projects to a backend store

---

## 📄 License

MIT © 2024 — feel free to fork, modify, and build on top of this project.
