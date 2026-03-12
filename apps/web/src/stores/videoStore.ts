import { create } from "zustand";

export type VideoSidebarPanel = 'trim' | 'audio' | 'subtitle' | 'text' | null;

export interface Subtitle {
  id: string;
  text: string;
  start: number;
  end: number;
}

interface VideoState {
  isLoaded: boolean;
  setIsLoaded: (isLoaded: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  trimStart: number;
  setTrimStart: (start: number) => void;
  trimEnd: number;
  setTrimEnd: (end: number) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  activeSidebarPanel: VideoSidebarPanel;
  setActiveSidebarPanel: (panel: VideoSidebarPanel) => void;
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  videoExt: string | null;
  setVideoExt: (ext: string | null) => void;

  // Text Overlay
  overlayText: string;
  setOverlayText: (text: string) => void;
  overlayTextColor: string;
  setOverlayTextColor: (color: string) => void;
  overlayFontSize: number;
  setOverlayFontSize: (size: number) => void;
  overlayX: number;
  setOverlayX: (x: number) => void;
  overlayY: number;
  setOverlayY: (y: number) => void;
  overlayStartTime: number;
  setOverlayStartTime: (time: number) => void;
  overlayEndTime: number;
  setOverlayEndTime: (time: number) => void;
  overlayEffect: 'none' | 'fade' | 'zoom';
  setOverlayEffect: (effect: 'none' | 'fade' | 'zoom') => void;

  // Subtitles
  subtitles: Subtitle[];
  setSubtitles: (subs: Subtitle[] | ((prev: Subtitle[]) => Subtitle[])) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  isLoaded: false,
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  progress: 0,
  setProgress: (progress) => set({ progress }),
  videoUrl: null,
  setVideoUrl: (url) => set({ videoUrl: url }),
  videoDuration: 0,
  setVideoDuration: (duration) => set({ videoDuration: duration }),
  trimStart: 0,
  setTrimStart: (start) => set({ trimStart: start }),
  trimEnd: 0,
  setTrimEnd: (end) => set({ trimEnd: end }),
  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  activeSidebarPanel: null,
  setActiveSidebarPanel: (panel) => set({ activeSidebarPanel: panel }),
  audioUrl: null,
  setAudioUrl: (url) => set({ audioUrl: url }),
  videoExt: null,
  setVideoExt: (ext) => set({ videoExt: ext }),

  overlayText: "",
  setOverlayText: (overlayText) => set({ overlayText }),
  overlayTextColor: "#ffffff",
  setOverlayTextColor: (overlayTextColor) => set({ overlayTextColor }),
  overlayFontSize: 32,
  setOverlayFontSize: (overlayFontSize) => set({ overlayFontSize }),
  overlayX: 50,
  setOverlayX: (overlayX) => set({ overlayX }),
  overlayY: 50,
  setOverlayY: (overlayY) => set({ overlayY }),
  overlayStartTime: 0,
  setOverlayStartTime: (overlayStartTime) => set({ overlayStartTime }),
  overlayEndTime: 5,
  setOverlayEndTime: (overlayEndTime) => set({ overlayEndTime }),
  overlayEffect: 'none',
  setOverlayEffect: (overlayEffect) => set({ overlayEffect }),

  subtitles: [],
  setSubtitles: (subs) => set((state) => ({ 
    subtitles: typeof subs === 'function' ? subs(state.subtitles) : subs 
  })),
}));

