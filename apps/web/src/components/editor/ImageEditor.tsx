"use client";

import { useImageEditor } from "@/hooks/useImageEditor";
import { useEditorStore } from "@/stores/editorStore";

export function ImageEditor() {
  const { canvasRef, containerRef, zoomTo } = useImageEditor();
  const { zoom } = useEditorStore();

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#0f0f0f] relative overflow-hidden bg-dot-pattern">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#404040 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />
      
      <div className="relative z-10 shadow-2xl rounded-sm overflow-hidden border border-neutral-800 bg-white">
        <canvas ref={canvasRef} />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 z-20 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/5 rounded-2xl px-2 py-1.5 flex items-center gap-1 shadow-2xl scale-110">
        <button 
          onClick={() => zoomTo(zoom * 0.8)}
          className="w-8 h-8 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all flex items-center justify-center font-bold text-lg"
        >
          −
        </button>
        <button 
          onClick={() => zoomTo(1)}
          className="px-2 min-w-[60px] h-8 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-all text-xs font-mono"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button 
          onClick={() => zoomTo(zoom * 1.2)}
          className="w-8 h-8 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-all flex items-center justify-center font-bold text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}
