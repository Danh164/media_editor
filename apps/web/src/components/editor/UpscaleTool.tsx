"use client";

import { useRef, useState, useCallback } from "react";
import { ZoomIn, Upload, Loader2, Download, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { FabricImage } from "fabric";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const SCALE_OPTIONS = [
  { value: "2", label: "2×" },
  { value: "3", label: "3×" },
  { value: "4", label: "4×" },
];

const FORMAT_OPTIONS = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

export function UpscaleTool() {
  const { canvas } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState("2");
  const [format, setFormat] = useState("png");
  const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null);
  const [newSize, setNewSize] = useState<{ w: number; h: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    setOrigSize(null);
    setNewSize(null);
    const url = URL.createObjectURL(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    e.target.value = "";
  };

  const handleUpscale = useCallback(async () => {
    if (!preview || !fileName) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(preview);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, fileName);

      const res = await fetch(`${API_BASE}/api/upscale?scale=${scale}&format=${format}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? "Upscale failed");
      }

      // Read metadata from response headers
      const ow = parseInt(res.headers.get("X-Original-Width") ?? "0", 10);
      const oh = parseInt(res.headers.get("X-Original-Height") ?? "0", 10);
      const nw = parseInt(res.headers.get("X-Upscaled-Width") ?? "0", 10);
      const nh = parseInt(res.headers.get("X-Upscaled-Height") ?? "0", 10);
      if (ow && oh) setOrigSize({ w: ow, h: oh });
      if (nw && nh) setNewSize({ w: nw, h: nh });

      const resultBlob = await res.blob();
      if (result) URL.revokeObjectURL(result);
      const resultUrl = URL.createObjectURL(resultBlob);
      setResult(resultUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to API server.");
    } finally {
      setIsProcessing(false);
    }
  }, [preview, fileName, scale, format, result]);

  const handleAddToCanvas = useCallback(() => {
    if (!canvas || !result) return;
    FabricImage.fromURL(result, { crossOrigin: "anonymous" }).then((img) => {
      const maxW = canvas.width! * 0.8;
      const maxH = canvas.height! * 0.8;
      if (img.width! > maxW || img.height! > maxH) {
        img.scale(Math.min(maxW / img.width!, maxH / img.height!));
      }
      img.set({
        left: (canvas.width! - img.getScaledWidth()) / 2,
        top: (canvas.height! - img.getScaledHeight()) / 2,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    });
  }, [canvas, result]);

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `upscaled-${scale}x.${format}`;
    a.click();
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result);
    setPreview(null);
    setResult(null);
    setFileName(null);
    setError(null);
    setOrigSize(null);
    setNewSize(null);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ZoomIn className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold text-white">AI Upscale</span>
      </div>

      <p className="text-xs text-neutral-500 leading-relaxed">
        Enlarge your image 2×, 3×, or 4× with high-quality Lanczos resampling.
      </p>

      {/* File upload area */}
      {!preview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 py-8 border border-dashed border-neutral-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-neutral-500 hover:text-neutral-300"
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">Click to select image</span>
          <span className="text-[10px] text-neutral-600">PNG, JPEG, WebP</span>
        </button>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 aspect-video flex items-center justify-center">
          <img
            src={result ?? preview}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          )}
        </div>
      )}

      {/* Size info */}
      {origSize && newSize && (
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="bg-neutral-900 rounded-lg px-3 py-2 border border-neutral-800">
            <p className="text-neutral-600 mb-0.5">Original</p>
            <p className="text-neutral-300">{origSize.w} × {origSize.h}px</p>
          </div>
          <div className="bg-indigo-900/20 rounded-lg px-3 py-2 border border-indigo-900/40">
            <p className="text-indigo-600 mb-0.5">Upscaled</p>
            <p className="text-indigo-300">{newSize.w} × {newSize.h}px</p>
          </div>
        </div>
      )}

      {/* Scale selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider">Scale</label>
        <div className="grid grid-cols-3 gap-2">
          {SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScale(opt.value)}
              className={cn(
                "py-2 rounded-xl border text-sm font-bold transition-all",
                scale === opt.value
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                  : "border-neutral-700 bg-neutral-900/50 text-neutral-400 hover:border-neutral-600 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Format selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-neutral-500 uppercase tracking-wider">Output Format</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFormat(opt.value)}
              className={cn(
                "py-2 rounded-xl border text-xs font-medium transition-all",
                format === opt.value
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                  : "border-neutral-700 bg-neutral-900/50 text-neutral-400 hover:border-neutral-600 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
      />

      {/* Action buttons */}
      {preview && (
        <div className="space-y-2">
          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-2"
            onClick={handleUpscale}
            disabled={isProcessing}
          >
            {isProcessing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Upscaling…</>
              : <><ZoomIn className="w-3.5 h-3.5" /> Upscale {scale}×</>
            }
          </Button>

          {result && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-neutral-700 text-neutral-300 gap-1.5"
                onClick={handleAddToCanvas}
              >
                Add to Canvas
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-neutral-700 text-neutral-300 gap-1.5"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          )}

          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-neutral-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
