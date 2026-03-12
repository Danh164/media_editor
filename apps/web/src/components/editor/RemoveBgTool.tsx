"use client";

import { useRef, useState, useCallback } from "react";
import { Wand2, Upload, Loader2, Download, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editorStore";
import { FabricImage } from "fabric";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function RemoveBgTool() {
  const { canvas } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(240);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    const url = URL.createObjectURL(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(url);
    e.target.value = "";
  };

  const handleRemoveBg = useCallback(async () => {
    if (!preview || !fileName) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(preview);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, fileName);

      const res = await fetch(`${API_BASE}/api/remove-bg?threshold=${threshold}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? "Remove BG failed");
      }

      const resultBlob = await res.blob();
      if (result) URL.revokeObjectURL(result);
      const resultUrl = URL.createObjectURL(resultBlob);
      setResult(resultUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to API server.");
    } finally {
      setIsProcessing(false);
    }
  }, [preview, fileName, threshold, result]);

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
    a.download = "removed-bg.png";
    a.click();
  };

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result);
    setPreview(null);
    setResult(null);
    setFileName(null);
    setError(null);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold text-white">Remove Background</span>
      </div>

      <p className="text-xs text-neutral-500 leading-relaxed">
        Upload an image with a plain background to remove it automatically.
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
        <div className="space-y-3">
          {/* Preview / result side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-neutral-600 text-center">Original</p>
              <div className="aspect-square rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900">
                <img src={preview} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-neutral-600 text-center">Result</p>
              <div className="aspect-square rounded-lg overflow-hidden border border-neutral-800 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23333%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23333%22/%3E%3Crect%20x%3D%220%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23222%22/%3E%3Crect%20x%3D%228%22%20y%3D%220%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23222%22/%3E%3C/svg%3E')]">
                {result ? (
                  <img src={result} alt="Result" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-700 text-xs">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : "–"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Threshold control */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>BG Threshold</span>
              <span className="font-mono">{threshold}</span>
            </div>
            <input
              type="range"
              min={150}
              max={255}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <p className="text-[10px] text-neutral-700">Higher = removes more of the background</p>
          </div>
        </div>
      )}

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
            onClick={handleRemoveBg}
            disabled={isProcessing}
          >
            {isProcessing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
              : <><Wand2 className="w-3.5 h-3.5" /> Remove Background</>
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
