"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Maximize2,
  Scissors, SplitSquareVertical, Volume2, VolumeX, ZoomIn, ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVideoStore } from "@/stores/videoStore";
import { VideoTimeline } from "./VideoTimeline";
import { TrimPanel } from "./TrimPanel";
import { AudioPanel } from "./AudioPanel";
import { useVideoEditor } from "@/hooks/useVideoEditor";

function formatTimestamp(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function VideoEditor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    videoUrl, isProcessing, progress, videoDuration,
    currentTime, setCurrentTime, activeSidebarPanel,
  } = useVideoStore();

  const { trimVideo, addAudioTrack } = useVideoEditor();

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, [setCurrentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  // Seek when clicking on the playhead area
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || videoDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoDuration;
  };

  // Active tool panel
  const renderPanel = () => {
    if (!activeSidebarPanel) return null;
    const panelClass = "w-64 shrink-0 bg-[#1a1a1a] border-l border-neutral-800 overflow-y-auto";
    if (activeSidebarPanel === "trim") {
      return (
        <div className={panelClass}>
          <TrimPanel onTrim={trimVideo} />
        </div>
      );
    }
    if (activeSidebarPanel === "audio") {
      return (
        <div className={panelClass}>
          <AudioPanel onAddAudio={addAudioTrack} />
        </div>
      );
    }
    if (activeSidebarPanel === "subtitle") {
      return (
        <div className={panelClass}>
          <div className="p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Subtitles</p>
            <p className="text-xs text-neutral-500">Subtitle tool coming soon.</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Main editor column */}
      <div className="flex flex-col flex-1 h-full bg-[#0a0a0a] min-w-0">
        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center p-6 bg-neutral-950/50 min-h-0">
          <div className="aspect-video w-full max-w-4xl bg-black rounded-xl shadow-2xl overflow-hidden border border-neutral-800 flex items-center justify-center relative group">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4 text-neutral-400">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-900" />
                  <div
                    className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"
                    style={{ animationDuration: "0.8s" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white">
                    {progress}%
                  </div>
                </div>
                <p className="text-sm">Processing video…</p>
              </div>
            ) : videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls={false}
                  autoPlay={false}
                />
                {/* Overlay controls */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    {isPlaying
                      ? <Pause className="w-6 h-6 text-white" />
                      : <Play className="w-6 h-6 text-white ml-1" />
                    }
                  </button>
                </div>
                {/* Time / fullscreen bar */}
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-mono text-white/80">
                    {formatTimestamp(currentTime)} / {formatTimestamp(videoDuration)}
                  </span>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-7 w-7">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-neutral-600">
                <svg className="w-16 h-16 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-neutral-500">No video loaded</p>
                <p className="text-xs text-neutral-700">Use the Upload tool in the sidebar</p>
              </div>
            )}
          </div>
        </div>

        {/* Playback Controls Bar */}
        <div className="h-14 border-t border-neutral-800 bg-[#141414] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white h-8 w-8" title="Split">
              <SplitSquareVertical className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white h-8 w-8" title="Trim">
              <Scissors className="w-4 h-4" />
            </Button>
            <div className="h-4 w-px bg-neutral-700 mx-1" />
            <Button
              variant="ghost" size="icon"
              className="text-neutral-400 hover:text-white h-8 w-8"
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; }}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="text-white hover:bg-white/10 h-10 w-10 rounded-full"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white h-8 w-8">
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="h-4 w-px bg-neutral-700 mx-1" />
            <Button
              variant="ghost" size="icon"
              className="text-neutral-400 hover:text-white h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <span className="text-xs font-mono text-neutral-500 min-w-[7ch]">
              {formatTimestamp(currentTime)}
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Button
              variant="ghost" size="icon"
              className="text-neutral-500 hover:text-white h-7 w-7"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost" size="icon"
              className="text-neutral-500 hover:text-white h-7 w-7"
              onClick={() => setZoom(z => Math.min(4, z + 0.25))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="h-48 bg-[#0f0f0f] border-t border-neutral-900 shrink-0 overflow-hidden flex flex-col">
          {/* Time Ruler */}
          <div
            className="h-6 border-b border-neutral-800 flex items-end px-4 text-[10px] text-neutral-700 font-mono select-none shrink-0 relative cursor-pointer"
            onClick={handleSeek}
          >
            <div className="w-28 shrink-0" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-1 border-l border-neutral-800 pl-1 h-full flex items-end pb-0.5">
                {String(i * 5).padStart(2, "0")}:00
              </div>
            ))}

            {/* Live playhead on ruler */}
            {videoDuration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                style={{ left: `calc(7rem + ${(currentTime / videoDuration) * (100)}%)` }}
              >
                <div className="absolute -top-0 -left-[4px] w-2 h-2 bg-red-500 rounded-sm rotate-45" />
              </div>
            )}
          </div>

          {/* Track rows */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            <VideoTimeline zoom={zoom} videoRef={videoRef} />
            {/* Audio track placeholder */}
            <div className="flex items-center h-10 px-4 gap-3">
              <div className="w-24 shrink-0 text-[10px] font-medium text-neutral-600">Audio Track</div>
              <div className="flex-1 h-full bg-neutral-900 rounded border border-neutral-800/50 flex items-center justify-center">
                {useVideoStore.getState().audioUrl ? (
                  <div className="w-full h-full bg-emerald-900/20 rounded border-x border-emerald-900/50" />
                ) : (
                  <span className="text-[10px] text-neutral-700">Empty</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel drawer */}
      {renderPanel()}
    </div>
  );
}
