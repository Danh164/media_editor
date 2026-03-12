"use client";

import { useState, useCallback } from "react";
import {
  X, Download, Image as ImageIcon, Video as VideoIcon,
  Check, ChevronDown, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { useVideoStore } from "@/stores/videoStore";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────
// Image export config
// ────────────────────────────────────────────
const IMAGE_FORMATS = [
  { id: "png", label: "PNG", description: "Lossless, supports transparency", mimeType: "image/png" },
  { id: "jpeg", label: "JPEG", description: "Smaller file, no transparency", mimeType: "image/jpeg" },
  { id: "webp", label: "WebP", description: "Modern format, best compression", mimeType: "image/webp" },
] as const;

const IMAGE_SCALES = [
  { id: "0.5", label: "0.5× (half size)" },
  { id: "1", label: "1× (original)" },
  { id: "2", label: "2× (retina)" },
];

// ────────────────────────────────────────────
// Video export config
// ────────────────────────────────────────────
const VIDEO_FORMATS = [
  { id: "mp4", label: "MP4", description: "Universal, best compatibility", ext: ".mp4", mime: "video/mp4" },
  { id: "webm", label: "WebM", description: "Web-optimized, open format", ext: ".webm", mime: "video/webm" },
] as const;

interface ExportModalProps {
  mode: "image" | "video";
  onClose: () => void;
}

export function ExportModal({ mode, onClose }: ExportModalProps) {
  const t = useTranslations("editor.export");
  const { canvas } = useEditorStore();
  const { videoUrl, videoExt } = useVideoStore();

  // Image state
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [imageQuality, setImageQuality] = useState(92);
  const [imageScale, setImageScale] = useState("1");

  // Video state
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // ── Image export ──────────────────────────
  const exportImage = useCallback(async () => {
    if (!canvas) return;
    setIsExporting(true);

    try {
      const scale = parseFloat(imageScale);
      const quality = imageFormat === "png" ? 1 : imageQuality / 100;

      // Ensure quality is only passed for formats that support it
      const options: any = {
        format: imageFormat === "jpeg" ? "jpeg" : imageFormat,
        multiplier: scale,
      };
      
      if (imageFormat !== "png") {
        options.quality = quality;
      }

      const dataUrl = canvas.toDataURL(options);

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `export-${new Date().getTime()}.${imageFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Export failed! Check console for details.");
    } finally {
      setIsExporting(false);
    }
  }, [canvas, imageFormat, imageQuality, imageScale]);

  // ── Video export ──────────────────────────
  const exportVideo = useCallback(async () => {
    if (!videoUrl) return;
    setIsExporting(true);

    try {
      const link = document.createElement("a");
      link.href = videoUrl;
      const ext = videoExt ? `.${videoExt}` : '.mp4';
      link.download = `edited-video-${new Date().getTime()}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (err) {
      console.error("Video export failed:", err);
      toast.error("Failed to download video. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [videoUrl, videoExt]);

  const handleExport = mode === "image" ? exportImage : exportVideo;

  // Compute file resolution info
  const canvasWidth = canvas?.width ?? 800;
  const canvasHeight = canvas?.height ?? 600;
  const scale = parseFloat(imageScale);
  const outW = Math.round(canvasWidth * scale);
  const outH = Math.round(canvasHeight * scale);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div className="w-full max-w-md bg-[#1a1a1a] border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              mode === "image" ? "bg-indigo-500/15" : "bg-purple-500/15"
            )}>
              {mode === "image"
                ? <ImageIcon className="w-4 h-4 text-indigo-400" />
                : <VideoIcon className="w-4 h-4 text-purple-400" />
              }
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {mode === "image" ? "Export Image" : "Export Video"}
              </h2>
              <p className="text-xs text-neutral-500">
                {mode === "image" ? "Download as PNG, JPEG, or WebP" : "Download your edited video"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {mode === "image" ? (
            <>
              {/* Format selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {IMAGE_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setImageFormat(fmt.id)}
                      className={cn(
                        "flex flex-col items-center py-3 px-2 rounded-xl border text-sm font-semibold transition-all",
                        imageFormat === fmt.id
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                          : "border-neutral-700 bg-neutral-900/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                      )}
                    >
                      {fmt.label}
                      <span className="text-[10px] font-normal mt-0.5 text-neutral-600 text-center leading-tight">
                        {fmt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {IMAGE_SCALES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setImageScale(s.id)}
                      className={cn(
                        "py-2.5 rounded-xl border text-xs font-medium transition-all",
                        imageScale === s.id
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                          : "border-neutral-700 bg-neutral-900/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-600 font-mono">
                  Output: {outW} × {outH} px
                </p>
              </div>

              {/* Quality slider (not for PNG) */}
              {imageFormat !== "png" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Quality</label>
                    <span className="text-xs font-mono text-neutral-300">{imageQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={imageQuality}
                    onChange={(e) => setImageQuality(parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-700 font-mono">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>
              )}

              {/* Canvas empty warning */}
              {!canvas && (
                <p className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  No image canvas to export. Open the Image Editor first.
                </p>
              )}
            </>
          ) : (
            <>
              {/* Info about the video */}
              {videoUrl ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <VideoIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white font-medium truncate">Edited video ready</p>
                    <p className="text-[11px] text-neutral-500">Click Download to save</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ) : (
                <p className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  No video loaded. Upload a video first.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <Button variant="outline" size="sm" className="flex-1 border-neutral-700 text-neutral-300 hover:text-white" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className={cn(
              "flex-1 gap-2 font-medium",
              mode === "image"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-purple-600 hover:bg-purple-500 text-white",
              exported && "bg-emerald-600 hover:bg-emerald-500"
            )}
            disabled={isExporting || (mode === "image" ? !canvas : !videoUrl)}
            onClick={handleExport}
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            ) : exported ? (
              <><Check className="w-4 h-4" /> Downloaded!</>
            ) : (
              <><Download className="w-4 h-4" /> Download</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
