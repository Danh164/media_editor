"use client";

import { useVideoStore } from "@/stores/videoStore";

export function SubtitleTrack({ zoom = 1 }: { zoom?: number }) {
  const { subtitles, videoDuration } = useVideoStore();

  if (videoDuration === 0) return null;

  return (
    <div className="flex items-center h-10 px-4 gap-3">
      <div className="w-24 shrink-0 text-[10px] font-medium text-neutral-600">Subtitles</div>
      <div 
        className="flex-1 h-full bg-neutral-900 rounded border border-neutral-800/50 relative overflow-hidden"
        style={{ minWidth: `${100 * zoom}%` }}
      >
        {subtitles.map((sub) => {
          const left = (sub.start / videoDuration) * 100;
          const width = ((sub.end - sub.start) / videoDuration) * 100;
          return (
            <div
              key={sub.id}
              className="absolute top-1 bottom-1 bg-yellow-500/30 border-x border-yellow-500/50 rounded flex items-center px-1 overflow-hidden"
              style={{ left: `${left}%`, width: `${width}%` }}
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
