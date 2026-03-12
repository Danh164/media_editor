"use client";

import { Square, Circle, Triangle, Star, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ShapePanel() {
  const t = useTranslations("editor.shapes");

  const addShape = (type: string) => {
    const eventMap: Record<string, string> = {
      square: "editor:addRect",
      circle: "editor:addCircle",
      triangle: "editor:addTriangle",
      star: "editor:addStar",
    };
    
    const eventName = eventMap[type];
    if (eventName) {
      window.dispatchEvent(new CustomEvent(eventName));
    }
  };

  const shapes = [
    { id: "square", icon: Square, label: "Square" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "triangle", icon: Triangle, label: "Triangle" },
    { id: "star", icon: Star, label: "Star" },
  ];

  return (
    <div className="w-64 bg-[#1a1a1a] border-l border-neutral-800 flex flex-col h-full shrink-0">
      <div className="h-12 border-b border-neutral-800 flex items-center px-4 shrink-0">
        <h2 className="text-sm font-semibold text-neutral-200">Shapes</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {shapes.map((shape) => {
            const Icon = shape.icon;
            return (
              <Button
                key={shape.id}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-700 transition-all group"
                onClick={() => addShape(shape.id)}
              >
                <Icon className="w-8 h-8 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{shape.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
