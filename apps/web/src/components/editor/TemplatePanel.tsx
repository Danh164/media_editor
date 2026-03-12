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
    
    // Dispatch event to reset viewport in useImageEditor
    window.dispatchEvent(new CustomEvent("editor:applyTemplate"));
    
    const width = canvas.getWidth();
    const height = canvas.getHeight();

    // Clear existing frames or slots
    const existingObjects = canvas.getObjects().filter(obj => (obj as any).isFrame || (obj as any).isSlot || (obj as any).isSlotImage);
    existingObjects.forEach(obj => canvas.remove(obj));

    if (id === "frame-1") {
      // Classic Border
      const frame = new Rect({
        left: 0,
        top: 0,
        width: width,
        height: height,
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
        width: width,
        height: height,
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
      const w = width / 2;
      const h = height;
      const collageId = `collage-${Date.now()}`;
      createSlot(0, 0, w, h, "#262626", "Slot 1", `${collageId}-1`);
      createSlot(w, 0, w, h, "#404040", "Slot 2", `${collageId}-2`);
    } else if (id === "collage-3") {
      // 3-Grid (1 big top, 2 small bottom)
      const w = width;
      const h = height / 2;
      const collageId = `collage-${Date.now()}`;
      createSlot(0, 0, w, h, "#262626", "Slot 1", `${collageId}-1`);
      createSlot(0, h, w / 2, h, "#404040", "Slot 2", `${collageId}-2`);
      createSlot(w / 2, h, w / 2, h, "#525252", "Slot 3", `${collageId}-3`);
    } else if (id === "collage-4") {
      // 4-Quarter
      const w = width / 2;
      const h = height / 2;
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
            className="w-full bg-neutral-900/50 rounded-2xl border border-neutral-800/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all p-3 flex flex-col items-center gap-3 group"
          >
            {/* Visual Preview */}
            <div className="w-full aspect-[4/3] rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden flex relative shadow-inner">
              {tpl.id === "frame-1" && (
                <div className="absolute inset-2 border-2 border-neutral-600 rounded-sm" />
              )}
              {tpl.id === "frame-3" && (
                <div className="absolute inset-0 border-[10px] border-white/90 border-b-[24px]" />
              )}
              {tpl.id === "collage-2" && (
                <div className="flex w-full h-full gap-px bg-neutral-800">
                  <div className="flex-1 bg-neutral-700/50 flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-neutral-600" />
                  </div>
                  <div className="flex-1 bg-neutral-700 flex items-center justify-center">
                     <ImageIcon className="w-3 h-3 text-neutral-600" />
                  </div>
                </div>
              )}
              {tpl.id === "collage-3" && (
                <div className="flex flex-col w-full h-full gap-px bg-neutral-800">
                  <div className="flex-1 bg-neutral-700/50 flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-neutral-600" />
                  </div>
                  <div className="flex-1 flex gap-px">
                     <div className="flex-1 bg-neutral-700 flex items-center justify-center">
                        <ImageIcon className="w-3 h-3 text-neutral-600" />
                     </div>
                     <div className="flex-1 bg-neutral-700/50 flex items-center justify-center">
                        <ImageIcon className="w-3 h-3 text-neutral-600" />
                     </div>
                  </div>
                </div>
              )}
              {tpl.id === "collage-4" && (
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-px bg-neutral-800">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="bg-neutral-700/50 flex items-center justify-center">
                       <ImageIcon className="w-3 h-3 text-neutral-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-neutral-300 group-hover:text-white transition-colors uppercase tracking-widest">{tpl.label}</span>
              <span className="text-[9px] text-neutral-600 font-medium italic">
                {tpl.type === 'collage' ? `${tpl.slots} slots` : 'classic frame'}
              </span>
            </div>
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
