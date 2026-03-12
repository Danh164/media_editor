"use client";

import { useState } from "react";
import { Toolbar } from "@/components/editor/Toolbar";
import { Sidebar } from "@/components/editor/Sidebar";
import { LayerPanel } from "@/components/editor/LayerPanel";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { ExportModal } from "@/components/editor/ExportModal";
import { RemoveBgTool } from "@/components/editor/RemoveBgTool";
import { UpscaleTool } from "@/components/editor/UpscaleTool";
import { ShapePanel } from "@/components/editor/ShapePanel";
import { TemplatePanel } from "@/components/editor/TemplatePanel";
import { usePathname } from "next/navigation";
import { useEditorStore } from "@/stores/editorStore";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mode = pathname.includes("/video") ? "video" : "image";
  const [showExport, setShowExport] = useState(false);
  const { activeTool } = useEditorStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f0f0f] text-neutral-200">
      <Toolbar onExport={() => setShowExport(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar mode={mode} />
        
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {children}
        </main>
        
        {mode === "image" && <LayerPanel />}

        {mode === "image" && activeTool === "removeBg" && (
          <div className="w-64 shrink-0 bg-[#1a1a1a] border-l border-neutral-800 overflow-y-auto">
            <RemoveBgTool />
          </div>
        )}
        {mode === "image" && activeTool === "upscale" && (
          <div className="w-64 shrink-0 bg-[#1a1a1a] border-l border-neutral-800 overflow-y-auto">
            <UpscaleTool />
          </div>
        )}
        {mode === "image" && activeTool === "shapes" && (
          <ShapePanel />
        )}
        {mode === "image" && activeTool === "templates" && (
          <TemplatePanel />
        )}

        {/* Show PropertiesPanel only if no specialized tool panel is active */}
        {!(activeTool === "removeBg" || activeTool === "upscale" || activeTool === "shapes" || activeTool === "templates") && (
          <PropertiesPanel />
        )}
      </div>

      {/* Export modal */}
      {showExport && (
        <ExportModal
          mode={mode}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
