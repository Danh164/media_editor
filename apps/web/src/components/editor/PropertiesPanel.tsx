"use client";

import { Slider } from "@/components/ui/slider";
import { useRef, useEffect, useState } from "react";
import { Settings2, SlidersHorizontal, Pen } from "lucide-react";
import { useEditorStore } from "@/stores/editorStore";
import { filters, FabricImage } from "fabric";

export function PropertiesPanel() {
  const { activeObject, activeTool, canvas, pushHistory, strokeColor, setStrokeColor, strokeWidth, setStrokeWidth } = useEditorStore();
  const [opacity, setOpacity] = useState(100);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  // Filter states
  const [blurValue, setBlurValue] = useState(0);
  const [brightnessValue, setBrightnessValue] = useState(0);
  const [hasGrayscale, setHasGrayscale] = useState(false);
  const [hasSepia, setHasSepia] = useState(false);

  // Sync state with activeObject
  useEffect(() => {
    if (activeObject) {
      setOpacity(Math.round((activeObject.opacity ?? 1) * 100));
      setPosX(Math.round(activeObject.left ?? 0));
      setPosY(Math.round(activeObject.top ?? 0));

      if (activeObject.type === "image") {
        const img = activeObject as FabricImage;
        const blurFilter = img.filters.find(f => f.type === "Blur") as any;
        const brightnessFilter = img.filters.find(f => f.type === "Brightness") as any;
        
        setBlurValue(blurFilter ? blurFilter.blur : 0);
        setBrightnessValue(brightnessFilter ? brightnessFilter.brightness : 0);
        setHasGrayscale(!!img.filters.find(f => f.type === "Grayscale"));
        setHasSepia(!!img.filters.find(f => f.type === "Sepia"));
      }
    }
  }, [activeObject]);

  const updateObject = (key: string, value: any) => {
    if (!activeObject || !canvas) return;
    activeObject.set(key, value);
    canvas.renderAll();
  };

  const handleOpacityChange = (val: number) => {
    setOpacity(val);
    updateObject("opacity", val / 100);
  };

  const commitHistory = () => {
    if (canvas) pushHistory(canvas.toJSON() as any);
  };

  const applyImageValueFilter = (filterClass: any, property: string, value: number) => {
    if (!activeObject || activeObject.type !== "image" || !canvas) return;
    const img = activeObject as FabricImage;
    
    // Remove existing filter of this type
    img.filters = img.filters.filter(f => f.type !== filterClass.type);
    
    if (value !== 0) {
      const filter = new filterClass({ [property]: value });
      img.filters.push(filter);
    }
    
    img.applyFilters();
    canvas.renderAll();
  };

  const toggleImageBooleanFilter = (filterClass: any, enabled: boolean) => {
    if (!activeObject || activeObject.type !== "image" || !canvas) return;
    const img = activeObject as FabricImage;
    
    img.filters = img.filters.filter(f => f.type !== filterClass.type);
    
    if (enabled) {
      img.filters.push(new filterClass());
    }
    
    img.applyFilters();
    canvas.renderAll();
    commitHistory();
  };

  if (!activeObject && activeTool !== "draw") {
    return (
      <div className="w-64 bg-[#1a1a1a] border-l border-neutral-800 flex flex-col h-full shrink-0">
        <div className="h-12 border-b border-neutral-800 flex items-center px-4 shrink-0">
          <Settings2 className="w-4 h-4 mr-2 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-200">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-neutral-500 p-4 text-center">
          Select an object to edit its properties
        </div>
      </div>
    );
  }

  // Draw properties (always show when active)
  if (activeTool === "draw") {
    return (
      <div className="w-64 bg-[#1a1a1a] border-l border-neutral-800 flex flex-col h-full shrink-0">
        <div className="h-12 border-b border-neutral-800 flex items-center px-4 shrink-0">
          <Pen className="w-4 h-4 mr-2 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-200">Drawing</h2>
        </div>
        <div className="flex-1 p-4 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-medium text-neutral-400">Brush Color</label>
            <input 
              type="color" 
              value={strokeColor} 
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer bg-transparent border border-neutral-800"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-400">Brush Size</label>
              <span className="text-xs text-neutral-500 font-mono">{strokeWidth}px</span>
            </div>
            <Slider 
              value={[strokeWidth]} 
              onValueChange={(val) => setStrokeWidth(Array.isArray(val) ? val[0] : val as unknown as number)} 
              max={100} 
              min={1}
              step={1} 
            />
          </div>
          <p className="text-[10px] text-neutral-500 italic mt-4 text-center">
             Drawing mode is active. Drag on the canvas to paint.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#1a1a1a] border-l border-neutral-800 flex flex-col h-full shrink-0">
      <div className="h-12 border-b border-neutral-800 flex items-center px-4 shrink-0">
        <Settings2 className="w-4 h-4 mr-2 text-neutral-400" />
        <h2 className="text-sm font-semibold text-neutral-200">Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-400">Opacity</label>
              <span className="text-xs text-neutral-500 font-mono">{opacity}%</span>
            </div>
            <Slider 
              value={[opacity]} 
              onValueChange={(val) => handleOpacityChange(Array.isArray(val) ? val[0] : val as unknown as number)} 
              onPointerUp={commitHistory}
              max={100} 
              step={1} 
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-neutral-400">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#141414] border border-neutral-800 rounded px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] text-neutral-500">X</span>
                <input 
                  type="number" 
                  value={posX} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPosX(val);
                    updateObject("left", val);
                  }}
                  onBlur={commitHistory}
                  className="bg-transparent text-sm text-neutral-200 outline-none w-full" 
                />
              </div>
              <div className="bg-[#141414] border border-neutral-800 rounded px-3 py-2 flex items-center gap-2">
                <span className="text-[10px] text-neutral-500">Y</span>
                <input 
                  type="number" 
                  value={posY} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPosY(val);
                    updateObject("top", val);
                  }}
                  onBlur={commitHistory}
                  className="bg-transparent text-sm text-neutral-200 outline-none w-full" 
                />
              </div>
            </div>
          </div>
          
          {activeObject && activeObject.type === 'i-text' && (
            <div className="space-y-3 pt-4 border-t border-neutral-800">
              <label className="text-xs font-medium text-neutral-400">Text Color</label>
              <input 
                type="color" 
                value={activeObject.fill as string || "#000000"} 
                onChange={(e) => updateObject("fill", e.target.value)}
                onBlur={commitHistory}
                className="w-full h-8 rounded cursor-pointer bg-transparent"
              />
            </div>
          )}

          {activeObject && activeObject.type === 'image' && activeTool === 'filter' && (
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-neutral-200">Filters</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-400">Blur</label>
                  <span className="text-xs text-neutral-500 font-mono">{blurValue.toFixed(2)}</span>
                </div>
                <Slider 
                  value={[blurValue]} 
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : (val as unknown as number);
                    setBlurValue(v);
                    applyImageValueFilter(filters.Blur, "blur", v);
                  }} 
                  onPointerUp={commitHistory}
                  max={1} 
                  step={0.01} 
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-400">Brightness</label>
                  <span className="text-xs text-neutral-500 font-mono">{brightnessValue.toFixed(2)}</span>
                </div>
                <Slider 
                  value={[brightnessValue]} 
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : (val as unknown as number);
                    setBrightnessValue(v);
                    applyImageValueFilter(filters.Brightness, "brightness", v);
                  }} 
                  onPointerUp={commitHistory}
                  min={-1}
                  max={1} 
                  step={0.05} 
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => toggleImageBooleanFilter(filters.Grayscale, !hasGrayscale)}
                  className={`text-xs py-2 rounded border focus:outline-none transition-colors ${
                    hasGrayscale 
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" 
                      : "bg-[#141414] border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  Grayscale
                </button>
                <button
                  onClick={() => toggleImageBooleanFilter(filters.Sepia, !hasSepia)}
                  className={`text-xs py-2 rounded border focus:outline-none transition-colors ${
                    hasSepia 
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300" 
                      : "bg-[#141414] border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  Sepia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
