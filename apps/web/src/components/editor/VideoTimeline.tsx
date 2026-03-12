"use client";

import { useVideoStore } from "@/stores/videoStore";
import { useRef, RefObject } from "react";

interface VideoTimelineProps {
  zoom?: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
}

export function VideoTimeline({ zoom = 1, videoRef }: VideoTimelineProps) {
  const { 
    videoDuration, trimStart, trimEnd, setTrimStart, setTrimEnd, currentTime,
    audioUrl, bgAudioStartTime, setBgAudioStartTime, bgAudioDuration,
    bgAudioTrimStart, setBgAudioTrimStart, bgAudioTrimEnd, setBgAudioTrimEnd
  } = useVideoStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const audioTrackRef = useRef<HTMLDivElement>(null);

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

  const handleAudioDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioTrackRef.current || videoDuration === 0) return;

    const trackRect = audioTrackRef.current.getBoundingClientRect();
    const initialT = (e.clientX - trackRect.left) / trackRect.width * videoDuration;
    const initialStart = bgAudioStartTime;

    const onMove = (ev: PointerEvent) => {
      const currentT = (ev.clientX - trackRect.left) / trackRect.width * videoDuration;
      const delta = currentT - initialT;
      let newStart = initialStart + delta;
      
      // Boundaries
      newStart = Math.max(0, Math.min(videoDuration - 0.1, newStart));
      setBgAudioStartTime(newStart);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleAudioTrim = (e: React.PointerEvent, handle: "start" | "end") => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioTrackRef.current || videoDuration === 0) return;

    const trackRect = audioTrackRef.current.getBoundingClientRect();
    const initialT = (e.clientX - trackRect.left) / trackRect.width * videoDuration;
    const initialTrimStart = bgAudioTrimStart;
    const initialTrimEnd = bgAudioTrimEnd;

    const onMove = (ev: PointerEvent) => {
      const currentT = (ev.clientX - trackRect.left) / trackRect.width * videoDuration;
      const delta = currentT - initialT;

      if (handle === "start") {
        let t = Math.max(0, Math.min(bgAudioTrimEnd - 0.1, initialTrimStart + delta));
        setBgAudioTrimStart(t);
      } else {
        let t = Math.max(bgAudioTrimStart + 0.1, Math.min(bgAudioDuration, initialTrimEnd + delta));
        setBgAudioTrimEnd(t);
      }
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
    <div className="flex flex-col gap-2 p-2">
      {/* Video Track */}
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
        </div>
      </div>

      {/* Audio Track */}
      {audioUrl && (
        <div className="flex items-center h-8 px-4 gap-3">
          <div className="w-24 shrink-0 text-[10px] font-medium text-neutral-400">Audio 1</div>
          <div
            ref={audioTrackRef}
            className="flex-1 relative h-full bg-neutral-900/40 rounded border border-neutral-800/50 overflow-hidden"
            style={{ minWidth: `${100 * zoom}%` }}
          >
            <div
              className="absolute top-1 bottom-1 bg-green-500/30 border border-green-500/50 rounded cursor-move hover:bg-green-500/40 transition-colors flex items-center px-2 group"
              style={{
                left: `${(bgAudioStartTime / videoDuration) * 100}%`,
                width: `${((bgAudioTrimEnd - bgAudioTrimStart) / videoDuration) * 100}%`,
                minWidth: "12px"
              }}
              onPointerDown={handleAudioDrag}
            >
              {/* Audio Trim Handles */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onPointerDown={(e) => handleAudioTrim(e, "start")}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-1 bg-green-400 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onPointerDown={(e) => handleAudioTrim(e, "end")}
              />

              <div className="flex gap-0.5 items-end h-3 opacity-40 overflow-hidden pointer-events-none w-full">
                {[1, 2, 3, 2, 4, 1, 3, 2, 4, 2, 1, 3, 2].map((h, i) => (
                  <div key={i} className="min-w-[2px] bg-green-400" style={{ height: `${h * 25}%` }} />
                ))}
              </div>
            </div>
            {/* Playhead sync */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500/50 z-30 pointer-events-none"
              style={{ left: `${playPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Global Time Ruler Underneath */}
      <div className="px-4 ml-24 flex justify-between pointer-events-none opacity-40">
          <span className="text-[8px] text-white font-mono">0s</span>
          <span className="text-[8px] text-white font-mono">{videoDuration.toFixed(1)}s</span>
      </div>
    </div>
  );
}
