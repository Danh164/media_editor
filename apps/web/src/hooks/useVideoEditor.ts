"use client";

import { useRef, useCallback, useEffect } from "react";
import { useVideoStore } from "@/stores/videoStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FFmpegInstance = any;

declare global {
  interface Window {
    FFmpeg: {
      createFFmpeg: (opts: Record<string, unknown>) => FFmpegInstance;
      fetchFile: (input: File | string | ArrayBuffer) => Promise<Uint8Array>;
    };
  }
}

/**
 * Injects the UMD build of @ffmpeg/ffmpeg from /public/ffmpeg/ffmpeg.min.js
 * via a <script> tag, bypassing Next.js/Webpack bundling entirely.
 * This avoids the `new URL(path, import.meta.url)` crash that occurs when
 * Webpack replaces import.meta.url with `undefined`.
 */
function loadFFmpegScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FFmpeg) {
      resolve();
      return;
    }
    const existing = document.getElementById("ffmpeg-script");
    if (existing) {
      // Script is loading, wait for it
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "ffmpeg-script";
    script.src = "/ffmpeg/ffmpeg.min.js";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function useVideoEditor() {
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const {
    setIsLoaded,
    setIsProcessing,
    setProgress,
    setVideoUrl,
    videoUrl,
    setVideoDuration,
    setTrimStart,
    setTrimEnd,
    setVideoExt,
  } = useVideoStore();

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return;

    try {
      // Inject the UMD script tag — bypasses all Webpack/Next.js bundler issues
      await loadFFmpegScript();

      const { createFFmpeg } = window.FFmpeg;

      const ffmpeg = createFFmpeg({
        log: true,
        // Absolute URL to the core wasm file in /public/ffmpeg/
        corePath: `${window.location.origin}/ffmpeg/ffmpeg-core.js`,
      });

      ffmpegRef.current = ffmpeg;

      ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
        setProgress(Math.round(ratio * 100));
      });

      await ffmpeg.load();
      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load FFmpeg:", e);
    }
  }, [setIsLoaded, setProgress]);

  // Load immediately on mount
  useEffect(() => {
    loadFFmpeg();
  }, [loadFFmpeg]);

  const handleFileUpload = async (file: File) => {
    if (!ffmpegRef.current || !ffmpegRef.current.isLoaded()) return;

    setIsProcessing(true);
    try {
      const ffmpeg = ffmpegRef.current;
      const { fetchFile } = window.FFmpeg;

      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const validExt = ['mp4', 'webm', 'mov', 'mkv'].includes(ext) ? ext : 'mp4';
      setVideoExt(validExt);

      const inputName = `input.${validExt}`;
      ffmpeg.FS("writeFile", inputName, await fetchFile(file));

      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);

      // Extract duration from a hidden video element
      const tempVideo = document.createElement("video");
      tempVideo.src = objectUrl;
      tempVideo.onloadedmetadata = () => {
        const d = Math.floor(tempVideo.duration);
        setVideoDuration(d);
        setTrimStart(0);
        setTrimEnd(d);
      };
    } catch (e) {
      console.error("Error uploading video:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const trimVideo = async (start: number, end: number) => {
    if (!ffmpegRef.current || !ffmpegRef.current.isLoaded()) return;

    setIsProcessing(true);
    setProgress(0);
    const ffmpeg = ffmpegRef.current;
    
    let lastErrorLog = "";
    ffmpeg.setLogger(({ type, message }: { type: string, message: string }) => {
      console.log(`[ffmpeg ${type}]`, message);
      if (type === "fferr" && message.toLowerCase().includes("error")) {
        lastErrorLog = message;
      }
    });

    try {
      const ext = useVideoStore.getState().videoExt || 'mp4';
      const inputName = `input.${ext}`;
      const outputName = `output.${ext}`;

      try { ffmpeg.FS("unlink", outputName); } catch (e) {}

      // Frame-accurate re-encode (copy fails on short web videos without keyframes)
      await ffmpeg.run(
        "-y",
        "-i", inputName,
        "-ss", start.toString(),
        "-t", (end - start).toString(),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        outputName
      );

      const data = ffmpeg.FS("readFile", outputName);
      const mime = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
      const objectUrl = URL.createObjectURL(
        new Blob([data], { type: mime })
      );

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(objectUrl);

      const d = end - start;
      setVideoDuration(d);
      setTrimStart(0);
      setTrimEnd(d);

      // Chain: write output back as input for future ops
      ffmpeg.FS("writeFile", inputName, data);
    } catch (e) {
      console.error("Error trimming video:", e);
      alert(`Trimming failed! FFmpeg error: ${lastErrorLog || 'Unknown crash'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const addAudioTrack = async (audioFile: File): Promise<void> => {
    if (!ffmpegRef.current || !ffmpegRef.current.isLoaded()) return;
    if (!useVideoStore.getState().videoUrl) return;

    const { setIsProcessing, setProgress, setVideoUrl, videoUrl } = useVideoStore.getState();
    setIsProcessing(true);
    setProgress(0);

    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = window.FFmpeg;

    let lastErrorLog = "";
    ffmpeg.setLogger(({ type, message }: { type: string, message: string }) => {
      console.log(`[ffmpeg ${type}]`, message);
      if (type === "fferr" && message.toLowerCase().includes("error")) {
        lastErrorLog = message;
      }
    });

    try {
      const ext = useVideoStore.getState().videoExt || 'mp4';
      const videoInputName = `input.${ext}`;
      const audioInputName = 'audio_in' + (audioFile.name.endsWith('.mp3') ? '.mp3' : '.aac');
      const outputName = `muxed_output.${ext}`;
      const audioCodec = ext === 'webm' ? 'libvorbis' : 'aac';

      try { ffmpeg.FS("unlink", audioInputName); } catch (e) {}
      try { ffmpeg.FS("unlink", outputName); } catch (e) {}

      ffmpeg.FS('writeFile', audioInputName, await fetchFile(audioFile));

      await ffmpeg.run(
        '-y',
        '-i', videoInputName,
        '-i', audioInputName,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', audioCodec,
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-shortest',
        outputName
      );

      const data = ffmpeg.FS('readFile', outputName);
      const mime = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
      const objectUrl = URL.createObjectURL(
        new Blob([data], { type: mime })
      );

      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(objectUrl);

      // Replace input for future operations
      ffmpeg.FS('writeFile', videoInputName, data);
    } catch (e) {
      console.error('Error adding audio track:', e);
      alert(`Adding audio failed! FFmpeg error: ${lastErrorLog || 'Unknown crash'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return {
    handleFileUpload,
    trimVideo,
    addAudioTrack,
  };
}
