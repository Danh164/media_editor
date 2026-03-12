# SKILL: Media Editor Web App

## Overview
Build a full-stack, open-source, Canva-like media editor supporting both **image** and **video** editing. The app runs in the browser with AI-powered features (remove background, upscale) handled by a backend API.

---

## Tech Stack (AI-chosen, optimized for this use case)

### Frontend
- **Framework**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Canvas/Image editing**: Fabric.js (drag & drop, layers, text overlay, draw)
- **Video editing**: FFmpeg.wasm (client-side trim/cut/merge) + custom timeline UI
- **i18n**: next-intl (Vietnamese + English)
- **State management**: Zustand
- **Drag & drop**: @dnd-kit/core

### Backend
- **Runtime**: Node.js + Fastify (or Next.js API routes)
- **AI - Remove Background**: Replicate API (`rembg` model) or local `@imgly/background-removal`
- **AI - Upscale**: Replicate API (`real-esrgan` model)
- **File storage**: Local filesystem (self-hosted) or MinIO
- **Queue**: BullMQ + Redis (for heavy AI jobs)

### Infrastructure
- **Containerization**: Docker + docker-compose
- **Reverse proxy**: Nginx

---

## Project Structure

```
media-editor/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── [locale]/             # i18n routing
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Landing / dashboard
│   │   │   │   └── editor/
│   │   │   │       ├── image/page.tsx
│   │   │   │       └── video/page.tsx
│   │   │   └── api/                  # Next.js API routes (proxy to backend)
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── ImageEditor.tsx   # Main image editor canvas
│   │   │   │   ├── VideoEditor.tsx   # Main video editor + timeline
│   │   │   │   ├── Sidebar.tsx       # Tool panel (left)
│   │   │   │   ├── Toolbar.tsx       # Top toolbar
│   │   │   │   ├── LayerPanel.tsx    # Layers panel (right)
│   │   │   │   ├── Timeline.tsx      # Video timeline (bottom)
│   │   │   │   └── ExportModal.tsx   # Export settings
│   │   │   ├── tools/
│   │   │   │   ├── CropTool.tsx
│   │   │   │   ├── FilterTool.tsx
│   │   │   │   ├── TextTool.tsx
│   │   │   │   ├── DrawTool.tsx
│   │   │   │   ├── RemoveBgTool.tsx
│   │   │   │   ├── SubtitleTool.tsx
│   │   │   │   └── AudioTool.tsx
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useImageEditor.ts
│   │   │   ├── useVideoEditor.ts
│   │   │   └── useFFmpeg.ts
│   │   ├── stores/
│   │   │   ├── editorStore.ts        # Zustand: canvas state
│   │   │   └── videoStore.ts         # Zustand: video timeline state
│   │   ├── lib/
│   │   │   ├── ffmpeg.ts             # FFmpeg.wasm wrapper
│   │   │   ├── fabric.ts             # Fabric.js helpers
│   │   │   └── api.ts                # API client
│   │   └── messages/
│   │       ├── en.json               # English strings
│   │       └── vi.json               # Vietnamese strings
│   └── api/                          # Backend (optional separate service)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── removeBg.ts
│       │   │   ├── upscale.ts
│       │   │   └── upload.ts
│       │   ├── jobs/                 # BullMQ job processors
│       │   └── index.ts
│       └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## Feature Specifications

### 🖼 Image Editor

#### Canvas Engine
- Use **Fabric.js** for all canvas operations
- Support layers (objects stacked, reorderable)
- Undo/Redo stack (max 50 steps) via Zustand
- Zoom in/out (10%–400%), pan with spacebar+drag

#### Tools
| Tool | Implementation |
|------|---------------|
| **Crop / Resize** | Fabric.js crop with aspect ratio lock; resize canvas dialog |
| **Filter / Effects** | Fabric.js filters: Brightness, Contrast, Saturation, Blur, Grayscale, Sepia, Vintage; custom LUT support |
| **Text Overlay** | Fabric.js IText; font picker (Google Fonts), size, color, shadow, outline |
| **Draw / Annotate** | Fabric.js free drawing; brush size/color/opacity; shape tools (rect, circle, arrow, line) |
| **Remove Background** | Upload to backend → Replicate rembg → return PNG with transparent bg |

#### Export
- PNG, JPG (quality slider), WEBP
- Download directly from canvas

---

### 🎬 Video Editor

#### Timeline Engine
- Custom React timeline component
- Track types: Video track, Audio track, Subtitle track
- Clips represented as colored blocks, draggable/resizable
- Playhead scrubbing
- Zoom timeline (1s–10min view)

#### FFmpeg.wasm Integration
- Load FFmpeg once on app init, cache in memory
- All operations run **client-side** (no server upload needed for basic ops)
- Show progress bar for long operations

#### Tools
| Tool | FFmpeg Command Pattern |
|------|----------------------|
| **Trim / Cut** | `-ss [start] -to [end] -c copy` |
| **Merge clips** | `concat` filter |
| **Add subtitles** | `subtitles=input.srt` or burn-in with drawtext |
| **Add music / audio** | `amix` filter, volume control per track |
| **Export formats** | MP4 (H.264), WEBM, GIF; resolution presets (720p, 1080p, 4K) |

#### Subtitle Editor
- Timeline-linked subtitle blocks
- Text, font size, color, position (top/center/bottom)
- Import .srt file
- Export .srt or burn into video

---

### 🤖 AI Features (Backend)

#### Remove Background
```
POST /api/ai/remove-bg
Body: { imageUrl: string } | FormData (file)
Response: { resultUrl: string }
```
- Use `@imgly/background-removal` for self-hosted (no API key needed)
- Fallback: Replicate API with `rembg` model

#### Upscale Image
```
POST /api/ai/upscale
Body: { imageUrl: string, scale: 2 | 4 }
Response: { resultUrl: string }
```
- Use Replicate `nightmareai/real-esrgan`
- Queue with BullMQ, poll for result

---

## UI/UX Layout (Canva-like)

```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR: [File] [Edit] [View] | [Undo][Redo] | [Export]│
├──────────┬──────────────────────────────┬───────────────┤
│          │                              │               │
│ SIDEBAR  │        CANVAS / PREVIEW      │  PROPERTIES   │
│ (Tools)  │                              │  PANEL        │
│          │   drag & drop elements here  │               │
│ - Crop   │                              │  (context-    │
│ - Filter │                              │   sensitive)  │
│ - Text   │                              │               │
│ - Draw   │                              │  LAYERS       │
│ - AI     │                              │  PANEL        │
│          │                              │               │
├──────────┴──────────────────────────────┴───────────────┤
│  TIMELINE (video only): [tracks + clips + playhead]     │
└─────────────────────────────────────────────────────────┘
```

### Design Language
- **Theme**: Dark mode default, light mode toggle
- **Color palette**: Near-black background `#0f0f0f`, accent `#6366f1` (indigo), surfaces `#1a1a1a`
- **Typography**: `Geist` (UI) + `Geist Mono` (values/numbers)
- **Sidebar width**: 64px icon-only, expands to 240px on hover/click
- **Transitions**: 150ms ease for tool switches, 300ms for panel open/close

---

## i18n Setup (next-intl)

```json
// messages/en.json (sample keys)
{
  "editor": {
    "image": "Image Editor",
    "video": "Video Editor",
    "tools": {
      "crop": "Crop",
      "filter": "Filter",
      "text": "Add Text",
      "draw": "Draw",
      "removeBg": "Remove Background",
      "upscale": "Upscale"
    },
    "export": {
      "title": "Export",
      "format": "Format",
      "quality": "Quality",
      "download": "Download"
    }
  }
}
```

```json
// messages/vi.json
{
  "editor": {
    "image": "Chỉnh sửa ảnh",
    "video": "Chỉnh sửa video",
    "tools": {
      "crop": "Cắt ảnh",
      "filter": "Bộ lọc",
      "text": "Thêm văn bản",
      "draw": "Vẽ",
      "removeBg": "Xóa nền",
      "upscale": "Tăng độ phân giải"
    },
    "export": {
      "title": "Xuất file",
      "format": "Định dạng",
      "quality": "Chất lượng",
      "download": "Tải xuống"
    }
  }
}
```

---

## Docker Setup

```yaml
# docker-compose.yml
version: "3.9"
services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}

  api:
    build: ./apps/api
    ports: ["4000:4000"]
    environment:
      - REDIS_URL=redis://redis:6379
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
    volumes:
      - uploads:/app/uploads

  redis:
    image: redis:7-alpine

  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf

volumes:
  uploads:
```

---

## Coding Conventions

- **Components**: PascalCase, one component per file
- **Hooks**: `use` prefix, colocate with component if single-use
- **Stores**: Zustand slices, typed with TypeScript interfaces
- **API routes**: RESTful, consistent error format `{ error: string, code: string }`
- **FFmpeg ops**: Always wrap in try/catch, always show progress to user
- **Canvas ops**: Debounce heavy operations (filters, resize) by 100ms
- **Avoid**: Any synchronous heavy computation on main thread — use Web Workers for FFmpeg + image processing

---

## Build Order (suggested for AI agent)

1. `apps/web` scaffold — Next.js + Tailwind + shadcn/ui + next-intl
2. Layout shell — Toolbar, Sidebar, PropertiesPanel, LayerPanel
3. Image Editor — Fabric.js canvas + Crop + Text + Draw tools
4. Filter system — Fabric.js filters UI
5. Video Editor — Timeline component + FFmpeg.wasm integration
6. Video tools — Trim, Merge, Subtitle, Audio
7. `apps/api` — Fastify + remove-bg + upscale endpoints
8. AI tools UI — RemoveBgTool, UpscaleTool (call backend)
9. Export flows — Image export modal, Video export modal
10. i18n — Wire all strings through next-intl
11. Docker — docker-compose + nginx config
12. README — Setup guide, env vars, self-hosting instructions
