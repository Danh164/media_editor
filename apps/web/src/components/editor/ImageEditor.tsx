"use client";

import { useImageEditor } from "@/hooks/useImageEditor";

export function ImageEditor() {
  const { canvasRef, containerRef } = useImageEditor();

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-[#0f0f0f] relative overflow-hidden bg-dot-pattern">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#404040 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />
      
      <div className="relative z-10 shadow-2xl rounded-sm overflow-hidden border border-neutral-800 bg-white">
        <canvas ref={canvasRef} />
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-20 bg-[#1a1a1a] border border-neutral-800 rounded-full px-4 py-2 flex items-center gap-4 shadow-lg text-sm text-neutral-400 select-none">
        <button className="hover:text-white transition-colors">-</button>
        <span className="w-12 text-center">100%</span>
        <button className="hover:text-white transition-colors">+</button>
      </div>
    </div>
  );
}
