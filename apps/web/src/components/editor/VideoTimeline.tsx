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

  const handleDrag = (e: React.PointerEvent, handle: "start" | "end" | "body") => {
    e.preventDefault();
    e.stopPropagation();
    if (!trackRef.current || videoDuration === 0) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const initialT = (e.clientX - trackRect.left) / trackRect.width * videoDuration;
    const initialStart = trimStart;
    const initialEnd = trimEnd;
    const duration = trimEnd - trimStart;

    const onMove = (ev: PointerEvent) => {
      const currentT = (ev.clientX - trackRect.left) / trackRect.width * videoDuration;
      const delta = currentT - initialT;

      if (handle === "start") {
        let t = Math.max(0, Math.min(trimEnd - 0.5, initialStart + delta));
        setTrimStart(t);
      } else if (handle === "end") {
        let t = Math.max(trimStart + 0.5, Math.min(videoDuration, initialEnd + delta));
        setTrimEnd(t);
      } else if (handle === "body") {
        let newStart = initialStart + delta;
        let newEnd = initialEnd + delta;

        if (newStart < 0) {
          newStart = 0;
          newEnd = duration;
        } else if (newEnd > videoDuration) {
          newEnd = videoDuration;
          newStart = videoDuration - duration;
        }

        setTrimStart(newStart);
        setTrimEnd(newEnd);
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || !videoRef?.current || videoDuration === 0) return;
    
    // Prevent dragging handles from triggering this
    if ((e.target as HTMLElement).classList.contains('cursor-ew-resize')) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const video = videoRef.current;

    const updateSeek = (clientX: number) => {
      const ratio = (clientX - trackRect.left) / trackRect.width;
      const t = Math.max(0, Math.min(videoDuration, ratio * videoDuration));
      video.currentTime = t;
    };

    updateSeek(e.clientX);

    const onMove = (ev: PointerEvent) => {
      updateSeek(ev.clientX);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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
        className="flex-1 relative h-full bg-neutral-800/60 rounded border border-neutral-700/50 cursor-pointer overflow-hidden touch-none"
        style={{ minWidth: `${100 * zoom}%` }}
        onPointerDown={handleTrackPointerDown}
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
          className="absolute top-1 bottom-1 rounded bg-indigo-500/20 border-y border-indigo-500/60 cursor-move z-10"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
          onPointerDown={(e) => handleDrag(e, "body")}
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
