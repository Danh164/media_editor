"use client";

import { useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
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
      const inputName = `input.${ext}`;
      const outputName = `output.${ext}`;
      const videoUrl = useVideoStore.getState().videoUrl;

      // CRITICAL: Ensure input reflects CURRENT state URL (stale FS is a common crash cause)
      if (videoUrl) {
        ffmpeg.FS("writeFile", inputName, await fetchFile(videoUrl));
      }

      try { ffmpeg.FS("unlink", outputName); } catch {}

      // Robustness: libx264 requires even dimensions + copy audio
      await ffmpeg.run(
        "-y",
        "-i", inputName,
        "-ss", start.toString(),
        "-t", (end - start).toString(),
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", // Ensure even dimensions
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "copy",
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
    } catch (e: any) {
      console.error("Error trimming video:", e);
      // More descriptive error
      const errorMsg = e?.message || lastErrorLog || 'Unknown crash (possibly OOM or invalid dimensions)';
      toast.error(`Trimming failed! FFmpeg error: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const addAudioTrack = async (audioFile: File, volume: number = 1.0, startTime: number = 0): Promise<void> => {
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
      const outputName = `mixed_output.${ext}`;
      
      // For MP4/MOV we use aac, for WebM we use libvorbis
      const audioCodec = ext === 'webm' ? 'libvorbis' : 'aac';

      try { ffmpeg.FS("unlink", audioInputName); } catch {}
      try { ffmpeg.FS("unlink", outputName); } catch {}

      ffmpeg.FS('writeFile', audioInputName, await fetchFile(audioFile));
      
      // Ensure video input is synced with latest state
      if (videoUrl) {
         ffmpeg.FS('writeFile', videoInputName, await fetchFile(videoUrl));
      }

      /**
       * MIXING STRATEGY:
       * 1. Apply adelay to new audio [1:a] based on 'startTime'.
       * 2. Apply volume to new audio.
       * 3. Mix original with new audio.
       */
      const delayMs = Math.floor(startTime * 1000);
      try {
        await ffmpeg.run(
          '-y',
          '-i', videoInputName,
          '-i', audioInputName,
          '-filter_complex', `[1:a]adelay=${delayMs}|${delayMs},volume=${volume}[new_a];[0:a][new_a]amix=inputs=2:duration=first[a]`,
          '-map', '0:v:0',
          '-map', '[a]',
          '-c:v', 'copy', 
          '-c:a', audioCodec,
          '-shortest',
          outputName
        );
      } catch (mixErr) {
        console.warn("Mixing failed (likely no source audio), falling back to replacement with delay/volume...");
        await ffmpeg.run(
          '-y',
          '-i', videoInputName,
          '-i', audioInputName,
          '-filter_complex', `[1:a]adelay=${delayMs}|${delayMs},volume=${volume}[a]`,
          '-map', '0:v:0',
          '-map', '[a]',
          '-c:v', 'copy',
          '-c:a', audioCodec,
          '-shortest',
          outputName
        );
      }

      const data = ffmpeg.FS('readFile', outputName);
      const mime = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
      const objectUrl = URL.createObjectURL(new Blob([data], { type: mime }));

      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(objectUrl);

      // Save for future ops
      ffmpeg.FS('writeFile', videoInputName, data);
      toast.success("Audio mixed successfully!");
    } catch (e) {
      console.error('Error mixing audio track:', e);
      toast.error(`Mixing audio failed! FFmpeg error: ${lastErrorLog || 'Unknown crash'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const burnSubtitles = useCallback(async () => {
    if (!ffmpegRef.current || !ffmpegRef.current.isLoaded()) {
      await loadFFmpeg();
    }
    
    const { 
      videoUrl, videoExt, setIsProcessing, setProgress, setVideoUrl,
      subtitles
    } = useVideoStore.getState();

    if (!videoUrl || !ffmpegRef.current || subtitles.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = window.FFmpeg;

    try {
      const ext = videoExt || "mp4";
      const inputName = `input.${ext}`;
      const outputName = `subtitle_output.${ext}`;
      const fontName = "font.ttf";

      // Write video
      ffmpeg.FS("writeFile", inputName, await fetchFile(videoUrl));
      
      // Write font (fetch from public folder)
      try {
        const fontResponse = await fetch("/fonts/font.ttf");
        const fontData = new Uint8Array(await fontResponse.arrayBuffer());
        ffmpeg.FS("writeFile", fontName, fontData);
      } catch (fontErr) {
        console.warn("Failed to load custom font for subtitles:", fontErr);
      }
      
      try { ffmpeg.FS("unlink", outputName); } catch {}

      /**
       * SUBTITLE BURNING:
       * We use drawtext repeatedly for each subtitle because 'subtitles' filter 
       * in wasm builds often has issues with font paths/configs.
       */
      const filters = subtitles.map(s => {
        const escaped = s.text.replace(/'/g, "'\\\\''");
        return `drawtext=fontfile=${fontName}:text='${escaped}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-60:enable='between(t,${s.start},${s.end})'`;
      }).join(',');

      await ffmpeg.run(
        "-y",
        "-i", inputName,
        "-vf", `scale=trunc(iw/2)*2:trunc(ih/2)*2,${filters}`,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "copy",
        outputName
      );

      const data = ffmpeg.FS("readFile", outputName);
      const mime = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
      const url = URL.createObjectURL(new Blob([data], { type: mime }));
      
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(url);
      
      ffmpeg.FS("writeFile", inputName, data);
      toast.success("Subtitles burned successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Subtitle burning failed!");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [loadFFmpeg, setIsProcessing, setProgress, setVideoUrl]);

  const burnText = useCallback(async () => {
    if (!ffmpegRef.current || !ffmpegRef.current.isLoaded()) {
      await loadFFmpeg();
    }
    
    const { 
      videoUrl, videoExt, setIsProcessing, setProgress, setVideoUrl,
      overlayText, overlayTextColor, overlayFontSize,
      overlayX, overlayY
    } = useVideoStore.getState();

    if (!videoUrl || !ffmpegRef.current) return;

    setIsProcessing(true);
    setProgress(0);
    const ffmpeg = ffmpegRef.current;
    const { fetchFile } = window.FFmpeg;

    try {
      const ext = videoExt || "mp4";
      const inputName = `input.${ext}`;
      const outputName = `text_output.${ext}`;
      const fontName = "font.ttf";

      // Write video
      ffmpeg.FS("writeFile", inputName, await fetchFile(videoUrl));
      
      // Write font (fetch from public folder)
      try {
        const fontResponse = await fetch("/fonts/font.ttf");
        const fontData = new Uint8Array(await fontResponse.arrayBuffer());
        ffmpeg.FS("writeFile", fontName, fontData);
      } catch (fontErr) {
        console.warn("Failed to load custom font, text may not render:", fontErr);
      }

      try { ffmpeg.FS("unlink", outputName); } catch {}

      // drawtext filter: escape text if needed
      const escapedText = overlayText.replace(/'/g, "'\\\\''");
      
      await ffmpeg.run(
        "-y",
        "-i", inputName,
        "-vf", `scale=trunc(iw/2)*2:trunc(ih/2)*2,drawtext=fontfile=${fontName}:text='${escapedText}':fontcolor=${overlayTextColor}:fontsize=${overlayFontSize}:x=(w*${overlayX}/100-text_w/2):y=(h*${overlayY}/100-text_h/2)`,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-c:a", "copy",
        outputName
      );

      const data = ffmpeg.FS("readFile", outputName);
      const mime = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4';
      const url = URL.createObjectURL(new Blob([data], { type: mime }));
      
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(url);
      
      // Chain
      ffmpeg.FS("writeFile", inputName, data);
      toast.success("Text burned successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Burning failed! See console for FFmpeg errors.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [loadFFmpeg, setIsProcessing, setProgress, setVideoUrl]);

  return {
    handleFileUpload,
    trimVideo,
    addAudioTrack,
    burnText,
    burnSubtitles,
  };
}
