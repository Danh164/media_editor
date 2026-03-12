"use client";

import { useVideoStore } from "@/stores/videoStore";
import { useRef, RefObject } from "react";

interface VideoTimelineProps {
  zoom?: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
}

export function VideoTimeline({ zoom = 1, videoRef }: VideoTimelineProps) {
  const { videoDuration, trimStart, trimEnd, setTrimStart, setTrimEnd, currentTime } = useVideoStore();
  const trackRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.PointerEvent, handle: "start" | "end") => {
    e.preventDefault();
    if (!trackRef.current || videoDuration === 0) return;

    const trackRect = trackRef.current.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      const offset = ev.clientX - trackRect.left;
      let t = Math.max(0, Math.min(videoDuration, (offset / trackRect.width) * videoDuration));
      if (handle === "start") {
        t = Math.min(t, trimEnd - 0.5);
        setTrimStart(t);
      } else {
        t = Math.max(t, trimStart + 0.5);
        setTrimEnd(t);
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !videoRef?.current || videoDuration === 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoDuration;
  };

  if (videoDuration === 0) {
    return (
      <div className="flex items-center h-10 px-4 gap-3">
        <div className="w-24 shrink-0 text-[10px] font-medium text-neutral-600">Video 1</div>
        <div className="flex-1 h-full bg-neutral-900 rounded border border-neutral-800/50 flex items-center justify-center text-[10px] text-neutral-700">
          Upload a video to view timeline
        </div>
      </div>
    );
  }

  const startPct = (trimStart / videoDuration) * 100;
  const endPct = (trimEnd / videoDuration) * 100;
  const playPct = (currentTime / videoDuration) * 100;

  return (
    <div className="flex items-center h-10 px-4 gap-3">
      <div className="w-24 shrink-0 text-[10px] font-medium text-neutral-400">Video 1</div>

      <div
        ref={trackRef}
        className="flex-1 relative h-full bg-neutral-800/60 rounded border border-neutral-700/50 cursor-pointer overflow-hidden"
        style={{ minWidth: `${100 * zoom}%` }}
        onClick={handleTrackClick}
      >
        {/* Trimmed-out region overlay (before start) */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-neutral-900/70 z-10"
          style={{ width: `${startPct}%` }}
        />
        {/* Trimmed-out region overlay (after end) */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-neutral-900/70 z-10"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Active region */}
        <div
          className="absolute top-1 bottom-1 rounded bg-indigo-500/20 border-y border-indigo-500/60"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />

        {/* Film strip pattern */}
        <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] pointer-events-none opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="border-r border-white/10 h-full" />
          ))}
        </div>

        {/* Trim handles */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-indigo-400 cursor-ew-resize z-20 hover:bg-white transition-colors"
          style={{ left: `${startPct}%`, transform: "translateX(-50%)" }}
          onPointerDown={(e) => handleDrag(e, "start")}
        />
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-indigo-400 cursor-ew-resize z-20 hover:bg-white transition-colors"
          style={{ left: `${endPct}%`, transform: "translateX(-50%)" }}
          onPointerDown={(e) => handleDrag(e, "end")}
        />

        {/* Live playhead */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
          style={{ left: `${playPct}%` }}
        />

        {/* Time labels */}
        <div className="absolute inset-x-2 bottom-0.5 flex justify-between pointer-events-none">
          <span className="text-[9px] text-white/30 font-mono">{trimStart.toFixed(1)}s</span>
          <span className="text-[9px] text-white/30 font-mono">{trimEnd.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
