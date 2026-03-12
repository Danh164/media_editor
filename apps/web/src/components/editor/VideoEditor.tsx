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
import { VideoTextPanel } from "./VideoTextPanel";
import { VideoSubtitlePanel } from "./VideoSubtitlePanel";
import { SubtitleTrack } from "./SubtitleTrack";
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
    overlayText, overlayTextColor, overlayFontSize,
    overlayX, setOverlayX, overlayY, setOverlayY,
    overlayStartTime, overlayEndTime, overlayEffect,
  } = useVideoStore();

  const [isDraggingText, setIsDraggingText] = useState(false);

  /* Hook moved below for consolidated destructuring */

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
  }, [handleTimeUpdate, videoUrl]);

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
    if (activeSidebarPanel === "text") {
      return (
        <div className={panelClass}>
          <VideoTextPanel onApplyText={burnText} />
        </div>
      );
    }
    if (activeSidebarPanel === "subtitle") {
      return (
        <div className={panelClass}>
          <VideoSubtitlePanel onApplySubtitles={burnSubtitles} />
        </div>
      );
    }
    return null;
  };

  const { trimVideo, addAudioTrack, burnText, burnSubtitles } = useVideoEditor();

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
                {/* Top Center Time Display */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-xs font-mono text-white tracking-widest">
                    {formatTimestamp(currentTime)} / {formatTimestamp(videoDuration)}
                  </span>
                </div>
                {/* Fullscreen bar */}
                <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-7 w-7">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {/* Interactive Text Overlay Preview */}
                {activeSidebarPanel === "text" && 
                 overlayText && 
                 currentTime >= overlayStartTime && 
                 currentTime <= overlayEndTime && (
                  <div 
                    className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
                    onMouseMove={(e) => {
                      if (!isDraggingText) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setOverlayX(Math.max(0, Math.min(100, x)));
                      setOverlayY(Math.max(0, Math.min(100, y)));
                    }}
                    onMouseUp={() => setIsDraggingText(false)}
                    onMouseLeave={() => setIsDraggingText(false)}
                  >
                    <div
                      className={`absolute cursor-move pointer-events-auto select-none whitespace-nowrap active:scale-95 transition-all duration-300
                        ${overlayEffect === 'fade' ? 'animate-in fade-in fill-mode-both' : ''}
                        ${overlayEffect === 'zoom' ? 'animate-in zoom-in fill-mode-both' : ''}
                      `}
                      style={{
                        left: `${overlayX}%`,
                        top: `${overlayY}%`,
                        transform: "translate(-50%, -50%)",
                        color: overlayTextColor,
                        fontSize: `${overlayFontSize}px`,
                        fontWeight: "bold",
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDraggingText(true);
                      }}
                    >
                      {overlayText}
                    </div>
                  </div>
                )}
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
          <div className="flex items-center gap-1.5 font-sans">
             <div className="flex items-center gap-1 mr-4">
               <span className="text-xs font-bold text-indigo-400 min-w-[5ch]">{formatTimestamp(currentTime)}</span>
               <span className="text-[10px] text-neutral-600">/</span>
               <span className="text-xs text-neutral-500 min-w-[5ch]">{formatTimestamp(videoDuration)}</span>
             </div>

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
            className="h-8 border-b border-neutral-800 flex items-center px-4 text-[10px] text-neutral-700 font-mono select-none shrink-0 relative cursor-pointer bg-neutral-900/40"
            onClick={handleSeek}
          >
            <div className="w-24 shrink-0 border-r border-neutral-800 h-full flex items-center px-2 text-neutral-500">
               TIMESTAMP
            </div>
            
            <div className="flex-1 h-full relative overflow-hidden">
               {/* Fixed width timeline container to match VideoTimeline */}
               <div 
                 className="absolute inset-0 flex"
                 style={{ width: `${zoom * 100}%` }}
               >
                 {Array.from({ length: Math.ceil((videoDuration || 60) / 5) + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="border-l border-neutral-800 h-full flex flex-col justify-between py-1 relative"
                      style={{ width: `${(5 / (videoDuration || 60)) * 100}%`, minWidth: '60px' }}
                    >
                      <span className="pl-1.5 text-neutral-500">{String(i * 5).padStart(2, "0")}s</span>
                      <div className="flex gap-1 pl-1">
                        {[1,2,3,4].map(j => <div key={j} className="w-px h-1 bg-neutral-800/50" />)}
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Live playhead on ruler */}
            {videoDuration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                style={{ left: `calc(6.5rem + ${(currentTime / videoDuration) * 98}%)` }}
              >
                <div className="absolute top-0 -left-[5px] w-2.5 h-2.5 bg-red-500 rounded-b-sm shadow-sm" />
              </div>
            )}
          </div>

          {/* Track rows */}
          <div className="flex-1 overflow-auto p-2 space-y-1.5 custom-scrollbar">
            <VideoTimeline zoom={zoom} videoRef={videoRef} />
            
            {/* Audio track */}
            <div className="flex items-center h-10 px-4 gap-3">
              <div className="w-24 shrink-0 text-[10px] font-medium text-neutral-600">Audio Track</div>
              <div 
                className="flex-1 h-full bg-neutral-900 rounded border border-neutral-800/50 relative overflow-hidden"
                style={{ minWidth: `${100 * zoom}%` }}
              >
                {useVideoStore.getState().audioUrl ? (
                  <div className="absolute inset-0 bg-emerald-500/10 border-y border-emerald-500/20 flex items-center px-4">
                    <div className="w-full h-2 bg-emerald-500/20 rounded-full overflow-hidden flex gap-0.5">
                       {Array.from({length: 40}).map((_, i) => (
                         <div key={i} className="flex-1 bg-emerald-400" style={{ height: `${Math.random() * 100}%` }} />
                       ))}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] text-neutral-700 italic">No audio track</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtitle track */}
            <SubtitleTrack zoom={zoom} />
          </div>
        </div>
      </div>

      {/* Right panel drawer */}
      {renderPanel()}
    </div>
  );
}
