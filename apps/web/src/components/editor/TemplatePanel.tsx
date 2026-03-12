"use client";

import { useEditorStore } from "@/stores/editorStore";
import { Frame, Image as ImageIcon } from "lucide-react";
import { Rect } from "fabric";

const TEMPLATES = [
  { id: "frame-1", label: "Classic Border", type: "frame" },
  { id: "frame-3", label: "Polaroid", type: "polaroid" },
  { id: "collage-2", label: "2-Split", type: "collage", slots: 2 },
  { id: "collage-3", label: "3-Grid", type: "collage", slots: 3 },
  { id: "collage-4", label: "4-Quarter", type: "collage", slots: 4 },
];

export function TemplatePanel() {
  const { canvas, pushHistory } = useEditorStore();

  const applyTemplate = (id: string) => {
    if (!canvas) return;
    
    // Clear existing frames if any
    const existingFrames = canvas.getObjects().filter(obj => (obj as any).isFrame);
    existingFrames.forEach(f => canvas.remove(f));

    if (id === "frame-1") {
      // Classic Border
      const frame = new Rect({
        left: 0,
        top: 0,
        width: canvas.width,
        height: canvas.height,
        fill: "transparent",
        stroke: "#000000",
        strokeWidth: 40,
        selectable: false,
        evented: false,
      });
      (frame as any).isFrame = true;
      canvas.add(frame);
      canvas.sendObjectToBack(frame);
    } else if (id === "frame-3") {
      // Polaroid
      const frame = new Rect({
        left: 0,
        top: 0,
        width: canvas.width,
        height: canvas.height,
        fill: "transparent",
        stroke: "#ffffff",
        strokeWidth: 100,
        selectable: false,
        evented: false,
      });
      (frame as any).isFrame = true;
      canvas.add(frame);
      canvas.sendObjectToBack(frame);
    } else if (id === "collage-2") {
      // 2-Split Vertical
      const w = canvas.width! / 2;
      const h = canvas.height!;
      const collageId = `collage-${Date.now()}`;
      createSlot(0, 0, w, h, "#262626", "Slot 1", `${collageId}-1`);
      createSlot(w, 0, w, h, "#404040", "Slot 2", `${collageId}-2`);
    } else if (id === "collage-3") {
      // 3-Grid (1 big top, 2 small bottom)
      const w = canvas.width!;
      const h = canvas.height! / 2;
      const collageId = `collage-${Date.now()}`;
      createSlot(0, 0, w, h, "#262626", "Slot 1", `${collageId}-1`);
      createSlot(0, h, w / 2, h, "#404040", "Slot 2", `${collageId}-2`);
      createSlot(w / 2, h, w / 2, h, "#525252", "Slot 3", `${collageId}-3`);
    } else if (id === "collage-4") {
      // 4-Quarter
      const w = canvas.width! / 2;
      const h = canvas.height! / 2;
      const collageId = `collage-${Date.now()}`;
      createSlot(0, 0, w, h, "#262626", "Slot 1", `${collageId}-1`);
      createSlot(w, 0, w, h, "#404040", "Slot 2", `${collageId}-2`);
      createSlot(0, h, w, h, "#525252", "Slot 3", `${collageId}-3`);
      createSlot(w, h, w, h, "#737373", "Slot 4", `${collageId}-4`);
    }
    
    canvas.renderAll();
    pushHistory(canvas.toJSON() as any);
  };

  const createSlot = (left: number, top: number, width: number, height: number, color: string, label: string, id: string) => {
    if (!canvas) return;
    const slot = new Rect({
      left,
      top,
      width,
      height,
      fill: color,
      stroke: "#ffffff",
      strokeWidth: 2,
      opacity: 1,
      selectable: true,
      hasControls: false, // Don't allow resizing slots individually
      hasBorders: true,
      hoverCursor: "pointer",
    });
    
    // Custom properties for slot logic
    (slot as any).isSlot = true;
    (slot as any).slotId = id;
    (slot as any).slotLabel = label;

    canvas.add(slot);
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
