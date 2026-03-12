"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Layers, Image as ImageIcon, Type, Square, Eye, EyeOff, Lock, Unlock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

import { useEditorStore } from "@/stores/editorStore";

export function LayerPanel() {
  const { canvas, layers, setLayers, activeObject, setActiveObject } = useEditorStore();

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    const obj = canvas.getObjects().find(o => (o as any).id === id);
    if (obj) {
      obj.visible = !obj.visible;
      canvas.renderAll();
      // Store will be updated by object:modified event in the hook
    }
  };

  const toggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    const obj = canvas.getObjects().find(o => (o as any).id === id);
    if (obj) {
      const isLocked = obj.lockMovementX; // Using lockMovementX as proxy for locked state
      const newState = !isLocked;
      obj.set({
        lockMovementX: newState,
        lockMovementY: newState,
        lockRotation: newState,
        lockScalingX: newState,
        lockScalingY: newState,
        selectable: !newState
      });
      canvas.renderAll();
      // Store will be updated by object:modified event
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "text": return <Type className="w-4 h-4 text-blue-400" />;
      case "shape": return <Square className="w-4 h-4 text-green-400" />;
      case "image": return <ImageIcon className="w-4 h-4 text-purple-400" />;
      default: return <Layers className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="w-64 bg-[#1a1a1a] border-l border-neutral-800 flex flex-col h-full shrink-0">
      <div className="h-12 border-b border-neutral-800 flex items-center px-4 shrink-0">
        <Layers className="w-4 h-4 mr-2 text-neutral-400" />
        <h2 className="text-sm font-semibold text-neutral-200">Layers</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 flex flex-col gap-1">
          {layers.map((layer) => {
            const isActive = activeObject && (activeObject as any).id === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => {
                   if (!canvas) return;
                   const obj = canvas.getObjects().find(o => (o as any).id === layer.id);
                   if (obj) canvas.setActiveObject(obj);
                   canvas.renderAll();
                }}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                  isActive ? "bg-indigo-500/20 text-indigo-100" : "hover:bg-neutral-800 text-neutral-400"
                )}
              >
              <div className="flex items-center gap-3 overflow-hidden">
                {getIcon(layer.type)}
                <span className="text-sm truncate select-none">{layer.name}</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-1",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
              )}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-neutral-500 hover:text-white"
                  onClick={(e) => toggleLock(layer.id, e)}
                >
                  {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-neutral-500 hover:text-white"
                  onClick={(e) => toggleVisibility(layer.id, e)}
                >
                  {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
              </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="h-12 border-t border-neutral-800 flex items-center justify-end px-2 shrink-0 bg-[#161616]">
        <Button 
           variant="ghost" 
           size="icon" 
           className="text-neutral-500 hover:text-red-400 hover:bg-neutral-800 h-8 w-8"
           onClick={() => {
             if (canvas && activeObject) {
               canvas.remove(activeObject);
               canvas.discardActiveObject();
               canvas.renderAll();
             }
           }}
           disabled={!activeObject}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
