"use client";

import { useRef, useState } from "react";
import { Music, Upload, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/stores/videoStore";
import { useTranslations } from "next-intl";

interface AudioPanelProps {
  onAddAudio: (file: File, volume: number) => Promise<void>;
}

export function AudioPanel({ onAddAudio }: AudioPanelProps) {
  const { audioUrl, setAudioUrl, isProcessing, videoUrl } = useVideoStore();
  const t = useTranslations("editor");
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [volumeRatio, setVolumeRatio] = useState(1);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioName(file.name);
    setSelectedFile(file);
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
    await onAddAudio(selectedFile, volumeRatio);
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

          {/* Volume control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                {t("audio.volume")}
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">{Math.round(volumeRatio * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={volumeRatio}
              onChange={(e) => setVolumeRatio(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
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
