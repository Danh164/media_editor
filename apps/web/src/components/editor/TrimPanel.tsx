"use client";

import { useState, useEffect } from "react";
import { Scissors, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/stores/videoStore";
import { useTranslations } from "next-intl";

interface TrimPanelProps {
  onTrim: (start: number, end: number) => Promise<void>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s}.${ms}`;
}

function parseTime(str: string): number {
  const [main, msStr] = str.split(".");
  const parts = main.split(":").map(Number);
  const secs = parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
  return secs + (msStr ? parseInt(msStr) / 10 : 0);
}

export function TrimPanel({ onTrim }: TrimPanelProps) {
  const { trimStart, trimEnd, videoDuration, setTrimStart, setTrimEnd, isProcessing } = useVideoStore();
  const t = useTranslations("editor");

  const [startInput, setStartInput] = useState(formatTime(trimStart));
  const [endInput, setEndInput] = useState(formatTime(trimEnd));

  useEffect(() => setStartInput(formatTime(trimStart)), [trimStart]);
  useEffect(() => setEndInput(formatTime(trimEnd)), [trimEnd]);

  const handleStartBlur = () => {
    const t = Math.max(0, Math.min(parseTime(startInput), trimEnd - 0.5));
    setTrimStart(t);
    setStartInput(formatTime(t));
  };

  const handleEndBlur = () => {
    const t = Math.min(videoDuration, Math.max(parseTime(endInput), trimStart + 0.5));
    setTrimEnd(t);
    setEndInput(formatTime(t));
  };

  const handleReset = () => {
    setTrimStart(0);
    setTrimEnd(videoDuration);
  };

  const duration = trimEnd - trimStart;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Scissors className="w-4 h-4 text-indigo-400" />
          {t("trim.title")}
        </div>
        <button
          onClick={handleReset}
          className="text-neutral-500 hover:text-white transition-colors"
          title={t("trim.reset")}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {videoDuration === 0 ? (
        <p className="text-xs text-neutral-500">{t("trim.uploadFirst")}</p>
      ) : (
        <>
          {/* Progress bar showing trim range */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{
                  marginLeft: `${(trimStart / videoDuration) * 100}%`,
                  width: `${((trimEnd - trimStart) / videoDuration) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-600 font-mono">
              <span>0:00</span>
              <span>{formatTime(videoDuration)}</span>
            </div>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider">{t("trim.start")}</label>
              <input
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={handleStartBlur}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-500 uppercase tracking-wider">{t("trim.end")}</label>
              <input
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={handleEndBlur}
              />
            </div>
          </div>

          <div className="text-xs text-neutral-500">
            {t("trim.outputDuration")}: <span className="text-neutral-300 font-mono">{formatTime(duration)}</span>
          </div>

          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
            disabled={isProcessing || videoDuration === 0}
            onClick={() => onTrim(trimStart, trimEnd)}
          >
            {isProcessing ? t("common.processing", { ns: "common" }) : t("trim.applyTrim")}
          </Button>
        </>
      )}
    </div>
  );
}
