"use client";

import { useEditorStore } from "@/stores/editorStore";
import { Image as ImageIcon, Frame, Maximize } from "lucide-react";

const TEMPLATES = [
  { id: "frame-1", label: "Classic Border", type: "frame" },
  { id: "frame-2", label: "Modern Glass", type: "glass" },
  { id: "frame-3", label: "Polaroid", type: "polaroid" },
];

export function TemplatePanel() {
  const { canvas, pushHistory } = useEditorStore();

  const applyTemplate = (id: string) => {
    if (!canvas) return;
    
    // Simple mock: Apply a border or background
    if (id === "frame-1") {
      canvas.backgroundColor = "#fafafa";
      // We could add a large rectangle as a frame
    }
    
    canvas.renderAll();
    pushHistory(canvas.toJSON() as any);
  };

  return (
    <div className="w-64 bg-[#1a1a1a] border-l border-neutral-800 flex flex-col h-full shrink-0">
      <div className="h-12 border-b border-neutral-800 flex items-center px-4 shrink-0">
        <h2 className="text-sm font-semibold text-neutral-200">Templates</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => applyTemplate(tpl.id)}
            className="w-full aspect-video bg-neutral-900 rounded-xl border border-neutral-800 hover:border-indigo-500 hover:bg-neutral-800/50 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
               <Frame className="w-5 h-5 text-neutral-500 group-hover:text-indigo-400" />
            </div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{tpl.label}</span>
          </button>
        ))}
        
        <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
          <p className="text-[11px] text-neutral-500 text-center leading-relaxed italic">
            "More templates coming soon in the next update!"
          </p>
        </div>
      </div>
    </div>
  );
}
