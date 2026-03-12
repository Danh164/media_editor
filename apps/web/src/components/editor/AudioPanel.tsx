"use client";

import { useRef, useState } from "react";
import { Music, Upload, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/stores/videoStore";
import { useTranslations } from "next-intl";

interface AudioPanelProps {
  onAddAudio: (file: File, volume: number, startTime: number) => Promise<void>;
}

export function AudioPanel({ onAddAudio }: AudioPanelProps) {
  const { 
    audioUrl, setAudioUrl, isProcessing, videoUrl,
    originalAudioVolume, setOriginalAudioVolume,
    bgAudioVolume, setBgAudioVolume,
    bgAudioStartTime, setBgAudioStartTime,
    bgAudioTrimStart, setBgAudioTrimStart,
    bgAudioTrimEnd, setBgAudioTrimEnd,
    bgAudioDuration, setBgAudioDuration
  } = useVideoStore();
  const t = useTranslations("editor");
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioName(file.name);
    setSelectedFile(file);

    // Get duration
    const tempAudio = document.createElement('audio');
    tempAudio.src = URL.createObjectURL(file);
    tempAudio.onloadedmetadata = () => {
      setBgAudioDuration(tempAudio.duration);
      setBgAudioTrimStart(0);
      setBgAudioTrimEnd(tempAudio.duration);
    };

    // Create preview URL
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  };

  const handleRemoveAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioName(null);
    setSelectedFile(null);
  };

  const handleApply = async () => {
    if (!selectedFile) return;
    await onAddAudio(selectedFile, bgAudioVolume, bgAudioStartTime);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Music className="w-4 h-4 text-indigo-400" />
        {t("audio.title")}
      </div>

      {!videoUrl ? (
        <p className="text-xs text-neutral-500">{t("audio.uploadFirst")}</p>
      ) : (
        <>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {t("audio.description")}
          </p>

          {/* Audio file selector */}
          {audioName ? (
            <div className="flex items-center gap-2 bg-neutral-900 rounded-md px-3 py-2 border border-neutral-700">
              <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-xs text-neutral-300 flex-1 truncate">{audioName}</span>
              <button
                onClick={handleRemoveAudio}
                className="text-neutral-600 hover:text-red-400 transition-colors"
                title={t("audio.removeAudio")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => audioInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 py-6 border border-dashed border-neutral-700 rounded-md hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-neutral-500 hover:text-neutral-300"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs">{t("audio.clickToSelect")}</span>
              <span className="text-[10px] text-neutral-600">{t("audio.supportedFormats")}</span>
            </button>
          )}

          <input
            ref={audioInputRef}
            type="file"
            hidden
            accept="audio/mp3,audio/wav,audio/aac,audio/mpeg,audio/*"
            onChange={handleAudioSelect}
          />

          {/* Original Volume control */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-neutral-500" />
                Original Video Volume
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">{Math.round(originalAudioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={originalAudioVolume}
              onChange={(e) => setOriginalAudioVolume(parseFloat(e.target.value))}
              className="w-full accent-neutral-600"
            />
          </div>

          {/* Background Volume control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <Music className="w-3 h-3 text-indigo-400" />
                {t("audio.volume")} (Background)
              </label>
              <span className="text-[10px] text-indigo-400 font-mono">{Math.round(bgAudioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={bgAudioVolume}
              onChange={(e) => setBgAudioVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Audio Info & Visual Trimmer */}
          <div className="space-y-3 px-1">
            <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
              <span>Total: {bgAudioDuration.toFixed(1)}s</span>
              <span className="text-indigo-400 font-semibold tracking-tight">Active: {(bgAudioTrimEnd - bgAudioTrimStart).toFixed(1)}s</span>
            </div>
            
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800/50">
              <div
                className="h-full bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all duration-300"
                style={{
                  marginLeft: `${(bgAudioTrimStart / (bgAudioDuration || 1)) * 100}%`,
                  width: `${((bgAudioTrimEnd - bgAudioTrimStart) / (bgAudioDuration || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="h-px bg-neutral-800/50 my-2" />

          {/* Segment selection (Internal Audio Timing) */}
          <div className="space-y-3">
            <h4 className="text-[10px] text-neutral-500 uppercase tracking-[0.15em] font-bold">Select Segment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                  Play From (s)
                </label>
                <input
                  type="number"
                  min={0}
                  max={bgAudioDuration}
                  step={0.1}
                  value={bgAudioTrimStart.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setBgAudioTrimStart(Math.max(0, Math.min(val, bgAudioTrimEnd - 0.1)));
                  }}
                  className="w-full bg-[#111] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-indigo-100 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                   Play Until (s)
                </label>
                <input
                  type="number"
                  min={bgAudioTrimStart + 0.1}
                  max={bgAudioDuration}
                  step={0.1}
                  value={bgAudioTrimEnd.toFixed(1)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setBgAudioTrimEnd(Math.max(bgAudioTrimStart + 0.1, Math.min(val, bgAudioDuration)));
                  }}
                  className="w-full bg-[#111] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-indigo-100 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-800/50 my-2" />

          {/* Placement control (Project-level Start Time) */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-neutral-500 uppercase tracking-[0.15em] font-bold">Placement</h4>
            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                Start at in Video (s)
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={bgAudioStartTime.toFixed(1)}
                onChange={(e) => setBgAudioStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#111] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none shine-on-focus"
              />
            </div>
          </div>

          {audioUrl && (
            <audio src={audioUrl} controls className="w-full h-8 rounded" />
          )}

          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
            disabled={!audioName || isProcessing}
            onClick={handleApply}
          >
            {isProcessing ? t("common.processing", { ns: "common" }) : t("audio.mergeAudio")}
          </Button>
        </>
      )}
    </div>
  );
}
