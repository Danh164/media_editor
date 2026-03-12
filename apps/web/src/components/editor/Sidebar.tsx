"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Scissors, Music, Upload, Video as VideoIcon, Crop, Filter, Type, Pen, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useVideoStore, VideoSidebarPanel } from "@/stores/videoStore";
import { useVideoEditor } from "@/hooks/useVideoEditor";

interface SidebarProps {
  mode: "image" | "video";
}

const imageModeTools = [
  { id: "upload", icon: Upload, label: "Upload Image" },
  { id: "crop", icon: Crop, label: "Crop & Resize" },
  { id: "filter", icon: Filter, label: "Filters" },
  { id: "text", icon: Type, label: "Add Text" },
  { id: "draw", icon: Pen, label: "Draw" },
  { id: "removeBg", icon: Wand2, label: "Remove BG" },
];

const videoModeTools: { id: VideoSidebarPanel | "uploadVideo"; icon: typeof Scissors; label: string }[] = [
  { id: "uploadVideo", icon: Upload, label: "Upload Video" },
  { id: "trim", icon: Scissors, label: "Trim & Cut" },
  { id: "audio", icon: Music, label: "Add Audio" },
  { id: "subtitle", icon: VideoIcon, label: "Subtitles" },
];

export function Sidebar({ mode }: SidebarProps) {
  const { activeTool, setActiveTool } = useEditorStore();
  const { activeSidebarPanel, setActiveSidebarPanel } = useVideoStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { handleFileUpload } = useVideoEditor();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const dataUrl = f.target?.result;
      if (typeof dataUrl === "string") {
        window.dispatchEvent(new CustomEvent("editor:addImage", { detail: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileUpload(file);
    e.target.value = "";
  };

  if (mode === "video") {
    return (
      <aside className="w-16 flex flex-col items-center py-4 gap-1 bg-[#1a1a1a] border-r border-neutral-800 transition-all duration-300 hover:w-56 overflow-hidden group/sidebar shrink-0">
        {videoModeTools.map((tool) => {
          const Icon = tool.icon;
          const isPanel = tool.id !== "uploadVideo";
          const isActive = isPanel && activeSidebarPanel === tool.id;

          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger
                onClick={() => {
                  if (tool.id === "uploadVideo") {
                    videoInputRef.current?.click();
                  } else {
                    setActiveSidebarPanel(isActive ? null : (tool.id as VideoSidebarPanel));
                  }
                }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-start px-3 shrink-0 group-hover/sidebar:w-[calc(100%-1rem)] transition-all",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-400" : "")} />
                <span className="ml-3 opacity-0 transition-opacity whitespace-nowrap group-hover/sidebar:opacity-100 text-sm">
                  {tool.label}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="group-hover/sidebar:hidden">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <input
          type="file"
          ref={videoInputRef}
          hidden
          accept="video/mp4,video/webm,video/quicktime"
          onChange={onVideoUpload}
        />
      </aside>
    );
  }

  // Image mode
  return (
    <aside className="w-16 flex flex-col items-center py-4 gap-1 bg-[#1a1a1a] border-r border-neutral-800 transition-all duration-300 hover:w-56 overflow-hidden group/sidebar shrink-0">
      {imageModeTools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger
              onClick={() => {
                setActiveTool(tool.id);
                if (tool.id === "upload") fileInputRef.current?.click();
                if (tool.id === "text") window.dispatchEvent(new CustomEvent("editor:addText"));
                if (tool.id === "draw") window.dispatchEvent(new CustomEvent("editor:addRect"));
              }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-start px-3 shrink-0 group-hover/sidebar:w-[calc(100%-1rem)] transition-all",
                isActive
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-400" : "")} />
              <span className="ml-3 opacity-0 transition-opacity whitespace-nowrap group-hover/sidebar:opacity-100 text-sm">
                {tool.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="right" className="group-hover/sidebar:hidden">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={handleImageUpload}
      />
    </aside>
  );
}
