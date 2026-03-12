"use client";

import { useRef } from "react";
import { useVideoStore } from "@/stores/videoStore";

export function SubtitleTrack({ zoom = 1 }: { zoom?: number }) {
  const { subtitles, setSubtitles, videoDuration } = useVideoStore();
  const trackRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.PointerEvent, subId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!trackRef.current || videoDuration === 0) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const initialT = (e.clientX - trackRect.left) / trackRect.width * videoDuration;
    
    // Find the specific subtitle being dragged
    const targetSub = subtitles.find(s => s.id === subId);
    if (!targetSub) return;

    const initialStart = targetSub.start;
    const initialEnd = targetSub.end;
    const duration = initialEnd - initialStart;

    const onMove = (ev: PointerEvent) => {
      const currentT = (ev.clientX - trackRect.left) / trackRect.width * videoDuration;
      const delta = currentT - initialT;

      let newStart = initialStart + delta;
      let newEnd = initialEnd + delta;

      // Bound checks
      if (newStart < 0) {
        newStart = 0;
        newEnd = duration;
      } else if (newEnd > videoDuration) {
        newEnd = videoDuration;
        newStart = videoDuration - duration;
      }

      setSubtitles(prev => prev.map(s => 
        s.id === subId ? { ...s, start: newStart, end: newEnd } : s
      ));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (videoDuration === 0) return null;

  return (
    <div className="flex items-center h-10 px-4 gap-3">
      <div className="w-24 shrink-0 text-[10px] font-medium text-neutral-600">Subtitles</div>
      <div 
        ref={trackRef}
        className="flex-1 h-full bg-neutral-900 rounded border border-neutral-800/50 relative overflow-hidden touch-none"
        style={{ minWidth: `${100 * zoom}%` }}
      >
        {subtitles.map((sub) => {
          const left = (sub.start / videoDuration) * 100;
          const width = ((sub.end - sub.start) / videoDuration) * 100;
          return (
            <div
              key={sub.id}
              className="absolute top-1 bottom-1 bg-yellow-500/30 border-x border-yellow-500/50 rounded flex items-center px-1 overflow-hidden cursor-grab active:cursor-grabbing z-10"
              style={{ left: `${left}%`, width: `${width}%` }}
              onPointerDown={(e) => handleDrag(e, sub.id)}
            >
              <span className="text-[9px] text-yellow-200 truncate whitespace-nowrap">
                {sub.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
