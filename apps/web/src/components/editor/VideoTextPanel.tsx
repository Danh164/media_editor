"use client";

import { useVideoStore } from "@/stores/videoStore";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Type, Palette, Type as FontIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface VideoTextPanelProps {
  onApplyText: () => void;
}

export function VideoTextPanel({ onApplyText }: VideoTextPanelProps) {
  const t = useTranslations("editor.tools");
  const { 
    overlayText, setOverlayText, 
    overlayTextColor, setOverlayTextColor,
    overlayFontSize, setOverlayFontSize,
    overlayStartTime, setOverlayStartTime,
    overlayEndTime, setOverlayEndTime,
    overlayEffect, setOverlayEffect,
    videoDuration, videoUrl
  } = useVideoStore();

  return (
    <div className="p-4 flex flex-col h-full gap-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-400" />
          {t("text")}
        </h3>
        <p className="text-xs text-neutral-500">Add a text overlay burned into the video.</p>
      </div>

      <div className="space-y-4">
        {/* Text Input */}
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">Content</label>
          <textarea
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="Enter text here..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-none"
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-2">
            <Palette className="w-3 h-3" /> Color
          </label>
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg p-2">
            <input
              type="color"
              value={overlayTextColor}
              onChange={(e) => setOverlayTextColor(e.target.value)}
              className="w-8 h-8 rounded shrink-0 bg-transparent cursor-pointer border-none"
            />
            <input
              type="text"
              value={overlayTextColor}
              onChange={(e) => setOverlayTextColor(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-neutral-300 focus:ring-0 p-0"
            />
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold flex items-center gap-2">
              <FontIcon className="w-3 h-3" /> Font Size
            </label>
            <span className="text-xs font-mono text-indigo-400">{overlayFontSize}px</span>
          </div>
          <Slider
            value={[overlayFontSize]}
            min={12}
            max={120}
            step={1}
            onValueChange={(val) => setOverlayFontSize((val as number[])[0])}
          />
        </div>

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">Start Time (s)</label>
            <input 
              type="number"
              value={overlayStartTime}
              onChange={(e) => setOverlayStartTime(Number(e.target.value))}
              min={0}
              max={videoDuration}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">End Time (s)</label>
            <input 
              type="number"
              value={overlayEndTime}
              onChange={(e) => setOverlayEndTime(Number(e.target.value))}
              min={0}
              max={videoDuration}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-sm text-white"
            />
          </div>
        </div>

        {/* Entrance Effect */}
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">Entrance Effect</label>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'fade', 'zoom'] as const).map(effect => (
              <button
                key={effect}
                onClick={() => setOverlayEffect(effect)}
                className={`py-2 px-3 rounded-lg text-xs capitalize border transition-all ${
                  overlayEffect === effect 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                }`}
              >
                {effect}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-4 border-t border-neutral-800">
        <Button
          onClick={onApplyText}
          disabled={!videoUrl || !overlayText.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-10"
        >
          Burn Text to Video
        </Button>
        {!videoUrl && (
          <p className="text-[10px] text-center text-red-400">Upload a video first.</p>
        )}
      </div>
    </div>
  );
}
